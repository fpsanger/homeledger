#!/usr/bin/env bash
#
# Periodic health check for the running HomeLedger instance. Run by
# homeledger-healthcheck.timer every 5 minutes.
#
# If the app is unhealthy it is restarted once. On success, and only on success,
# a heartbeat is sent to HOMELEDGER_HEARTBEAT_URL if that is set — so when the
# app, the host or the power goes down the heartbeats stop and the monitoring
# service alerts. Without HOMELEDGER_HEARTBEAT_URL this still self-heals a dead
# app and records the failure in the journal, but nothing will page you.

set -uo pipefail

SERVICE="${HOMELEDGER_SERVICE:-homeledger}"
HEALTH_URL="${HOMELEDGER_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
HEARTBEAT_URL="${HOMELEDGER_HEARTBEAT_URL:-}"

SUDO=""
if [[ "$(id -u)" != "0" ]]; then SUDO="sudo"; fi

probe() {
  curl -fsS --max-time 10 "$HEALTH_URL" >/dev/null 2>&1
}

heartbeat() {
  [[ -n "$HEARTBEAT_URL" ]] || return 0
  curl -fsS --max-time 10 --retry 2 "$HEARTBEAT_URL" >/dev/null 2>&1 ||
    echo "warning: could not send heartbeat" >&2
}

if probe; then
  heartbeat
  exit 0
fi

echo "health check failed at $HEALTH_URL; restarting $SERVICE" >&2
$SUDO systemctl restart "$SERVICE"

for _ in $(seq 1 15); do
  sleep 2
  if probe; then
    echo "$SERVICE recovered after restart" >&2
    heartbeat
    exit 0
  fi
done

echo "$SERVICE is still unhealthy after a restart; check: journalctl -u $SERVICE -n 100" >&2
exit 1
