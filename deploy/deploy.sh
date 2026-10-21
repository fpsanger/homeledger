#!/usr/bin/env bash
#
# Deploy a HomeLedger release on the self-hosted Linux box.
#
#   deploy/deploy.sh <commit-sha> <source-dir>
#
# Builds the release in its own directory, applies migrations, then atomically
# repoints `current` and restarts the service. Anything that fails before the
# swap leaves the running release untouched; a failed restart or health check
# rolls back to the previous release.
#
# See docs/deployment.md for one-time host setup.

set -euo pipefail

SHA="${1:?usage: deploy.sh <commit-sha> <source-dir>}"
SOURCE_DIR="${2:?usage: deploy.sh <commit-sha> <source-dir>}"

APP_ROOT="${HOMELEDGER_ROOT:-/srv/homeledger}"
SERVICE="${HOMELEDGER_SERVICE:-homeledger}"
HEALTH_URL="${HOMELEDGER_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
HEALTH_TIMEOUT_SECONDS="${HOMELEDGER_HEALTH_TIMEOUT_SECONDS:-60}"
KEEP_RELEASES="${HOMELEDGER_KEEP_RELEASES:-5}"

RELEASES_DIR="$APP_ROOT/releases"
CURRENT_LINK="$APP_ROOT/current"
SHARED_ENV="$APP_ROOT/shared/.env"

SUDO=""
if [[ "$(id -u)" != "0" ]]; then SUDO="sudo"; fi

log() { printf '==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "$SHARED_ENV" ]] || fail "missing $SHARED_ENV (see docs/deployment.md)"
[[ -d "$SOURCE_DIR" ]] || fail "source directory $SOURCE_DIR does not exist"

# Remember where to go back to. Empty on the very first deploy.
PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
fi

# Redeploying the commit that is already live must not rebuild the running
# release in place, which would also leave nothing to roll back to.
RELEASE_DIR="$RELEASES_DIR/$SHA"
if [[ -n "$PREVIOUS_RELEASE" && "$PREVIOUS_RELEASE" == "$RELEASE_DIR" ]]; then
  RELEASE_DIR="$RELEASES_DIR/$SHA-$(date -u +%Y%m%d%H%M%S)"
fi

restart_service() {
  $SUDO systemctl restart "$SERVICE"
}

health_ok() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  while ((SECONDS < deadline)); do
    if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback() {
  if [[ -z "$PREVIOUS_RELEASE" || ! -d "$PREVIOUS_RELEASE" ]]; then
    fail "deploy failed and there is no previous release to roll back to"
  fi
  log "rolling back to $PREVIOUS_RELEASE"
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK.tmp"
  mv -T "$CURRENT_LINK.tmp" "$CURRENT_LINK"
  restart_service
  if health_ok; then
    fail "deploy failed; rolled back to $(basename "$PREVIOUS_RELEASE")"
  fi
  fail "deploy failed AND rollback did not come up healthy; check: journalctl -u $SERVICE -n 100"
}

log "staging release $SHA"
mkdir -p "$RELEASE_DIR"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'coverage' \
  --exclude 'test-results' \
  --exclude 'playwright-report' \
  --exclude 'blob-report' \
  "$SOURCE_DIR/" "$RELEASE_DIR/"

# prisma.config.ts does `import "dotenv/config"`, so the CLI reads this file too.
ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env"

cd "$RELEASE_DIR"

log "installing dependencies"
npm ci

log "generating Prisma client"
npx prisma generate

# `next build` never connects to the database, so building before migrating means
# a broken build cannot leave the schema ahead of the running code.
log "building"
npm run build

log "applying migrations"
npx prisma migrate deploy

log "activating release $SHA"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.tmp"
mv -T "$CURRENT_LINK.tmp" "$CURRENT_LINK"

restart_service || rollback

log "waiting for $HEALTH_URL"
health_ok || rollback

log "pruning old releases (keeping $KEEP_RELEASES)"
# Never prune the release we just activated or the one we can roll back to.
while read -r old; do
  [[ -z "$old" ]] && continue
  [[ "$old" == "$RELEASE_DIR" || "$old" == "$PREVIOUS_RELEASE" ]] && continue
  rm -rf "$old"
done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
  sort -rn | tail -n "+$((KEEP_RELEASES + 1))" | cut -d' ' -f2-)

log "deployed $SHA"
