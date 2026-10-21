# Deployment

HomeLedger is self-hosted on an always-on Linux machine and reached from the owner's devices over
Tailscale. Every push to `develop` that passes CI redeploys that host automatically.

The app has **no authentication** (see `README.md`), so the tailnet is the only thing standing
between the data and the network. Everything below assumes that, and nothing here should be used to
expose the app publicly.

## How a deploy runs

1. A push lands on `develop` and the `CI` workflow runs on GitHub's hosted runners.
2. When CI succeeds, `.github/workflows/deploy.yml` fires via `workflow_run` and is picked up by the
   self-hosted runner on the host.
3. The runner checks out the exact commit CI validated and runs `deploy/deploy.sh`, which:
   - rsyncs the checkout into `/srv/homeledger/releases/<sha>/`,
   - links the shared `.env` into the release,
   - `npm ci`, `prisma generate`, `npm run build`,
   - `prisma migrate deploy`,
   - repoints `/srv/homeledger/current` atomically and restarts `homeledger.service`,
   - polls `/api/health` for up to 60s,
   - prunes all but the newest 5 releases.
4. If the restart or health check fails, the script repoints `current` back to the previous release,
   restarts, and exits non-zero so the GitHub run goes red.

GitHub runs a `workflow_run`-triggered workflow from the copy of the file on the repository's
**default branch**, which for this repository is `develop`. If the default branch ever changes,
`deploy.yml` has to exist there too or nothing will fire. For a first run, or any time the trigger
does not fire, use **Actions → Deploy → Run workflow**.

The build runs **before** migrations on purpose: `next build` never connects to the database, so a
broken build cannot leave the schema ahead of the running code.

### Migrations are forward-only

A rollback reverts code, not schema. `prisma migrate deploy` has already run by the time a health
check can fail, so **every migration must be backward-compatible with the previous release**: add
columns and tables, don't rename or drop them in the same release that stops using them. Drop in a
later release once the new code is running.

## Host layout

```
/srv/homeledger/
  releases/<sha>/        full release: source + node_modules + .next
  current -> releases/<sha>
  shared/.env            DATABASE_URL and friends, chmod 600, never in git
```

## One-time host setup

Run as a user with sudo. `DEPLOY_USER` below is the account that will own the app and run the
GitHub Actions runner — your normal login is fine.

### 1. Node 22

Match `.nvmrc`. Install from NodeSource so Node lands at `/usr/bin/node`; an nvm-managed path is
not reliable under systemd.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs rsync curl
node --version   # expect v22.x
```

### 2. Directory skeleton

```bash
sudo mkdir -p /srv/homeledger/releases /srv/homeledger/shared
sudo chown -R "$USER":"$USER" /srv/homeledger
```

### 3. Database credential

The host needs its own `DATABASE_URL`. Create a **separate Neon role (or a separate Neon branch)
for the host** rather than copying the one from your development `.env`, so the two can be revoked
independently.

Write `/srv/homeledger/shared/.env` with mode `600`:

```
DATABASE_URL="postgresql://<host-role>:<password>@<neon-host>/neondb?sslmode=require"
NODE_ENV=production
# Optional, see "Uptime monitoring" below:
# HOMELEDGER_HEARTBEAT_URL="https://hc-ping.com/<your-uuid>"
```

```bash
chmod 600 /srv/homeledger/shared/.env
```

Neon's free tier suspends compute after five minutes idle, so the first request after a quiet
period pays a cold start. The health-check timer below incidentally keeps compute warm, which also
consumes CU-hours against the free allowance — if that becomes a problem, lengthen the timer's
interval.

### 4. systemd service

```bash
sudo cp deploy/homeledger.service /etc/systemd/system/
sudo sed -i "s/DEPLOY_USER/$USER/" /etc/systemd/system/homeledger.service
sudo systemctl daemon-reload
sudo systemctl enable homeledger
```

Don't start it yet — there is no release to run.

### 5. sudoers entry for the deploy

The deploy and the health check restart the service as an unprivileged user. Check where
`systemctl` lives first (`command -v systemctl`) and use that path:

```bash
sudo tee /etc/sudoers.d/homeledger-deploy >/dev/null <<ENTRY
$USER ALL=(root) NOPASSWD: /bin/systemctl restart homeledger, /bin/systemctl start homeledger, /bin/systemctl stop homeledger, /bin/systemctl is-active homeledger
ENTRY
sudo chmod 440 /etc/sudoers.d/homeledger-deploy
sudo visudo -c        # must report "parsed OK"
sudo -l | grep systemctl
```

### 6. First deploy by hand

Prove the whole path before wiring GitHub to it.

```bash
git clone git@github.com:fpsanger/homeledger.git ~/homeledger-src
cd ~/homeledger-src && git checkout develop
bash deploy/deploy.sh "$(git rev-parse HEAD)" "$PWD"
systemctl status homeledger
curl -i http://127.0.0.1:3000/api/health
```

### 7. GitHub Actions self-hosted runner

In the repository: **Settings → Actions → Runners → New self-hosted runner**, choose Linux, and
follow the generated commands. When `./config.sh` asks for labels, add `homeledger-prod` — the
deploy workflow targets `[self-hosted, linux, homeledger-prod]`.

Then install it as a service so it survives reboots:

```bash
sudo ./svc.sh install "$USER"
sudo ./svc.sh start
```

The runner only makes outbound connections, so no ports need opening.

### 8. Tailscale exposure

```bash
sudo tailscale serve --bg --https=443 http://127.0.0.1:3000
tailscale serve status
```

The app itself binds to `127.0.0.1` (see `ExecStart` in `deploy/homeledger.service`), so
`tailscale serve` is the only way in, and it provides a MagicDNS name with an automatic HTTPS
certificate: `https://<host>.<tailnet>.ts.net`.

**Do not use `tailscale funnel`.** Funnel publishes the service to the public internet, and
HomeLedger has no login — that would expose all financial data to anyone with the URL.

### 9. Uptime monitoring

The deploy-time health gate only proves the new release came up. The timer catches it dying later:

```bash
sudo cp deploy/homeledger-healthcheck.service deploy/homeledger-healthcheck.timer /etc/systemd/system/
sudo sed -i "s/DEPLOY_USER/$USER/" /etc/systemd/system/homeledger-healthcheck.service
sudo systemctl daemon-reload
sudo systemctl enable --now homeledger-healthcheck.timer
systemctl list-timers homeledger-healthcheck.timer
```

Every five minutes it probes `/api/health`, restarts the service once if the probe fails, and —
only on success — pings `HOMELEDGER_HEARTBEAT_URL` if that is set in `shared/.env`.

That heartbeat is a dead man's switch: set it to a free check URL (for example from
healthchecks.io) and you get alerted when the pings stop, which covers the cases a timer on the
host cannot report itself — the host being off, or a power cut. Only an opaque UUID leaves the
network; no application data is sent. Leave `HOMELEDGER_HEARTBEAT_URL` unset and the timer still
self-heals a dead app and records failures in the journal, but nothing will notify you.

## Operations

```bash
# What is running
ls -l /srv/homeledger/current
systemctl status homeledger
journalctl -u homeledger -n 100 -f
```

Redeploy or deploy a specific commit from **Actions → Deploy → Run workflow**, using the `ref`
input.

```bash
# Roll back by hand
ls -t /srv/homeledger/releases          # newest first
ln -sfn /srv/homeledger/releases/<sha> /srv/homeledger/current.tmp
mv -T /srv/homeledger/current.tmp /srv/homeledger/current
sudo systemctl restart homeledger
curl -i http://127.0.0.1:3000/api/health

# Health check on demand
/srv/homeledger/current/deploy/healthcheck.sh
```

`deploy/deploy.sh` honours these overrides, which is useful for a second environment on the same
host: `HOMELEDGER_ROOT`, `HOMELEDGER_SERVICE`, `HOMELEDGER_HEALTH_URL`,
`HOMELEDGER_HEALTH_TIMEOUT_SECONDS`, `HOMELEDGER_KEEP_RELEASES`.

## Why self-hosted

Running on a machine you already own costs nothing beyond electricity, keeps financial data on your
own disk, and — because the app has no login — lets the tailnet be the access control. Hosting the
same app on Vercel Pro with a Neon Launch database would cost roughly US$30–45/month *and* require
building authentication first. Postgres stays on Neon's free tier so the host remains stateless:
losing the machine costs a reinstall, not data, which is why there is no backup job here.
