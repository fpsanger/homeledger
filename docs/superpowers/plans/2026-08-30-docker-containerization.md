# Docker Containerization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add supported development and production-like Docker workflows for the HomeLedger application and PostgreSQL database.

**Architecture:** A single Node.js 22 Alpine multi-stage image supplies development, migration, build, and non-root runtime targets. Separate development and production-like Compose files coordinate PostgreSQL, the explicit one-shot migration job, and the application without coupling migrations to application startup.

**Tech Stack:** Docker, Docker Compose, Node.js 22 Alpine, Next.js 14 standalone output, Prisma 7, PostgreSQL 16 Alpine, Jest.

**Spec:** `docs/superpowers/specs/2026-08-30-docker-containerization-design.md`

## Global Constraints

- Keep `src/domain` free of application, infrastructure, UI, React, Next.js, and Prisma imports.
- Keep database migrations explicit through `docker compose run --rm migrate`; application startup must not apply migrations.
- Run the production application as a dedicated non-root user.
- Do not commit secrets or copy `.env` files into Docker images.
- Keep PostgreSQL at version 16 and Node.js at version 22.
- No Prisma schema or financial behavior changes are part of this work.

---

### Task 1: Health endpoint and standalone build

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `tests/app/api/health/route.test.ts`
- Modify: `next.config.mjs`

**Interfaces:**
- Produces: `GET(): Promise<Response>` at `/api/health`, returning status 200 and `{ "status": "ok" }`.
- Produces: Next.js standalone output under `.next/standalone` after `npm run build`.

- [ ] **Step 1: Write the failing route test**

```ts
import { GET } from "../../../../src/app/api/health/route";

describe("GET /api/health", () => {
  it("reports that the application process is ready", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the route does not exist**

Run: `npm test -- --runInBand tests/app/api/health/route.test.ts`

Expected: FAIL with a module resolution error for `src/app/api/health/route`.

- [ ] **Step 3: Add the minimal health route**

```ts
export async function GET() {
  return Response.json({ status: "ok" });
}
```

- [ ] **Step 4: Enable standalone output**

Set the existing Next.js configuration to:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};
```

Keep the existing PWA wrapper and development-only PWA disablement unchanged.

- [ ] **Step 5: Run the focused test and production build**

Run: `npm test -- --runInBand tests/app/api/health/route.test.ts`

Expected: PASS with 1 test.

Run: `npm run build`

Expected: exit 0 and `.next/standalone/server.js` exists.

- [ ] **Step 6: Commit the application-facing prerequisite**

```bash
git add next.config.mjs src/app/api/health/route.ts tests/app/api/health/route.test.ts
git commit -m "feat: add container health endpoint"
```

### Task 2: Container image and Compose workflows

**Files:**
- Create: `.dockerignore`
- Create: `Dockerfile`
- Create: `compose.yaml`
- Create: `compose.dev.yaml`
- Delete: `docker-compose.yml`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `.next/standalone/server.js` and `GET /api/health` from Task 1.
- Produces: Docker targets `development`, `migration`, and `runner`.
- Produces: Compose services `postgres`, `migrate`, and `app` in both operational modes.
- Produces: npm scripts `docker:dev`, `docker:dev:migrate`, `docker:build`, `docker:migrate`, `docker:up`, and `docker:down`.

- [ ] **Step 1: Confirm the new Compose contract is initially absent**

Run: `docker compose -f compose.yaml config --quiet`

Expected: FAIL because `compose.yaml` does not exist.

- [ ] **Step 2: Add `.dockerignore`**

Include `.git`, `.github`, `.next`, `node_modules`, test reports, coverage, local environment files,
Docker Compose files, documentation, and debug logs. Explicitly retain `.env.example` only for
documentation while excluding `.env` and `.env*.local`.

- [ ] **Step 3: Add the multi-stage `Dockerfile`**

Implement these stages:

- `base`: `node:22-alpine`, `/app`, and `NEXT_TELEMETRY_DISABLED=1`.
- `dependencies`: copy `package.json` and `package-lock.json`, then `npm ci`.
- `development`: copy dependencies and source, expose 3000, run `npm run dev -- --hostname 0.0.0.0`.
- `builder`: copy dependencies and source, accept a build-time placeholder `DATABASE_URL`, run
  `npm run build`.
- `migration`: copy dependencies and source, run
  `npx prisma migrate deploy --schema src/infrastructure/database/schema.prisma`.
- `runner`: create UID/GID 1001 `nextjs`/`nodejs`, copy `public`, `.next/standalone`, and
  `.next/static` with ownership, set `HOSTNAME=0.0.0.0`, expose 3000, switch to `nextjs`, and run
  `node server.js`.

- [ ] **Step 4: Replace the legacy Compose file with production-like `compose.yaml`**

Define:

- PostgreSQL 16 Alpine with local defaults parameterized as `${POSTGRES_USER:-homeledger}`,
  `${POSTGRES_PASSWORD:-homeledger}`, `${POSTGRES_DB:-homeledger}`, a named data volume,
  `pg_isready`, and no mandatory host port.
- `migrate` built from target `migration`, using the internal PostgreSQL URL, depending on healthy
  PostgreSQL, and assigned to the `tools` profile so normal `up` does not run it.
- `app` built from target `runner`, using the internal PostgreSQL URL, depending only on healthy
  PostgreSQL, publishing `${APP_PORT:-3000}:3000`, and checking `/api/health` with Node's built-in
  HTTP client.

- [ ] **Step 5: Add `compose.dev.yaml`**

Define the same three service names, using PostgreSQL host port `${POSTGRES_PORT:-5433}:5432`.
Build `app` from the `development` target, mount `.:/app`, isolate `/app/node_modules` and
`/app/.next` in named volumes, set `WATCHPACK_POLLING=true`, and use the same explicit profiled
`migrate` service and database health dependency.

- [ ] **Step 6: Add npm convenience scripts**

Add these exact entries and refresh `package-lock.json` with `npm install --package-lock-only`:

```json
"docker:dev": "docker compose -f compose.dev.yaml up --build",
"docker:dev:migrate": "docker compose -f compose.dev.yaml --profile tools run --rm migrate",
"docker:build": "docker compose build app",
"docker:migrate": "docker compose --profile tools run --rm migrate",
"docker:up": "docker compose up -d app",
"docker:down": "docker compose down"
```

- [ ] **Step 7: Run Compose configuration checks**

Run: `docker compose config --quiet`

Expected: exit 0.

Run: `docker compose -f compose.dev.yaml config --quiet`

Expected: exit 0.

- [ ] **Step 8: Build and smoke-test the production-like stack**

Run: `docker compose build app migrate`

Expected: both targets build successfully.

Run: `docker compose run --rm --no-deps app id -u`

Expected: `1001`, proving the runtime image does not execute as root.

Run: `docker compose up -d postgres`

Expected: PostgreSQL becomes healthy.

Run: `docker compose --profile tools run --rm migrate`

Expected: every committed Prisma migration is applied and the command exits 0.

Run: `docker compose up -d app`

Expected: app becomes healthy.

Run: `curl --fail --silent http://localhost:3000/api/health`

Expected: `{\"status\":\"ok\"}`.

Run: `docker compose down --volumes`

Expected: smoke-test containers, network, and disposable test volume are removed.

- [ ] **Step 9: Commit the container workflows**

```bash
git add .dockerignore Dockerfile compose.yaml compose.dev.yaml docker-compose.yml package.json package-lock.json
git commit -m "chore: add Docker application workflows"
```

### Task 3: Operational documentation and final verification

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Docker and npm commands introduced in Task 2.
- Produces: documented host-based, Docker development, and Docker production-like procedures.

- [ ] **Step 1: Update the README**

Keep the existing host-based setup and add distinct sections documenting:

- prerequisites (Docker Engine/Desktop with Compose v2);
- development: copy `.env.example`, `npm run docker:dev:migrate`, then `npm run docker:dev`;
- production-like: override credentials as needed, `npm run docker:build`,
  `npm run docker:migrate`, then `npm run docker:up`;
- health URL, logs (`docker compose logs -f app`), stop commands, and the destructive local reset
  command `docker compose down --volumes` with an explicit data-loss warning;
- why migrations are separate and why production credentials must be overridden.

- [ ] **Step 2: Update the changelog**

Under `[Unreleased]`, add an `### Added` entry describing the full development and production-like
Docker workflows, optimized non-root image, health checks, and explicit migration service.

- [ ] **Step 3: Run repository verification**

Run: `npm run verify:fast`

Expected: Biome, TypeScript, quality checks, Jest, quality ratchet, and Next.js build all exit 0.

Run: `git diff --check`

Expected: no output and exit 0.

- [ ] **Step 4: Review operational safety**

Confirm with `git diff --cached --check` and `rg -n "neondb_owner|npg_" . --glob '!node_modules/**' --glob '!.git/**'` that no local `.env` secret entered a tracked file. Confirm `docker compose config` does not make the application depend on migration completion.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: document Docker workflows"
```

- [ ] **Step 6: Record final branch state**

Run: `git status --short --branch`

Expected: branch `chore/docker-containerization` with a clean working tree.
