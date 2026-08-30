# Docker Containerization Design

## Objective

Provide supported Docker workflows for HomeLedger in both local development and production-like
execution. The solution must containerize the Next.js application and PostgreSQL while keeping
database migrations explicit and operationally visible.

## Current State

The repository already provides `docker-compose.yml` for PostgreSQL 16 only. Developers run Node.js
22, Prisma migrations, and the Next.js server directly on the host. There is no application image,
production container, container health check, or documented full-stack Docker workflow.

## Chosen Approach

Use one multi-stage `Dockerfile` and two Compose files:

- `compose.yaml` defines the production-like stack: PostgreSQL, an explicit migration service, and
  the optimized Next.js application image.
- `compose.dev.yaml` defines the development stack: PostgreSQL and the Next.js development server
  with source bind mounts and container-managed dependencies.
- The existing `docker-compose.yml` is replaced to avoid maintaining two competing default Compose
  definitions.

This keeps image construction centralized while separating development-only mounts and commands
from production behavior. A single Compose file with profiles would reduce the file count but make
the operational modes less obvious. Separate Dockerfiles would be explicit but duplicate Node,
dependency, and build configuration.

## Container Image

The `Dockerfile` uses Node.js 22 on Alpine and contains reusable dependency, development, build,
migration, and runtime stages. Dependency installation uses `npm ci` and the committed lockfile.

The production build uses Next.js `output: "standalone"`. The runtime stage copies only the
standalone server, static assets, and public assets required at runtime. It runs as a dedicated
non-root user, listens on port 3000, and receives `DATABASE_URL` at runtime rather than embedding
credentials in the image.

The migration target retains the Prisma CLI, generated client, schema, and versioned migrations. It
executes `prisma migrate deploy` only when explicitly invoked.

## Development Workflow

`docker compose -f compose.dev.yaml up --build` starts PostgreSQL and the Next.js development
server. The project source is bind-mounted for hot reload, while anonymous or named volumes keep
container `node_modules` and generated build output isolated from the host.

The development application connects to PostgreSQL through the Compose service name and waits for
the database health check. Migrations are applied separately with the development Compose file,
using its `migrate` service.

## Production-like Workflow

The default `compose.yaml` builds the optimized runtime image and starts PostgreSQL with persistent
storage. The application depends on a healthy database but does not automatically run migrations.
Operators first invoke the one-shot `migrate` service and then start the application stack.

Compose provides local default database credentials for convenience. Deployments outside a local
machine must override secrets and connection settings through environment variables; secrets are
not copied into the image or committed to the repository.

## Health, Startup, and Failure Behavior

PostgreSQL uses `pg_isready`. The application adds `GET /api/health`, returning a small JSON success
response without accessing or mutating financial data; Compose uses it to determine HTTP readiness.
Service dependency conditions prevent the application and migration job from starting before
PostgreSQL is ready.

Migration failures produce a non-zero one-shot container exit and do not silently start the
application. Application failures remain visible through Compose status and logs. Database data is
stored in a named volume and survives normal container recreation.

## Repository Changes

The implementation will:

- add the multi-stage `Dockerfile` and `.dockerignore`;
- replace `docker-compose.yml` with `compose.yaml` and add `compose.dev.yaml`;
- enable Next.js standalone output;
- add `GET /api/health` with focused route coverage;
- add focused automated coverage for any new application code;
- add npm convenience scripts for Docker workflows where they reduce command ambiguity;
- update `README.md` with development, production-like, migration, log, stop, and volume-reset
  commands;
- update `CHANGELOG.md` under `[Unreleased]` for the new operational workflow.

No domain behavior or Prisma schema changes are part of this work, so no database migration is
created.

## Verification

Verification must cover:

1. `docker compose config` for both Compose files.
2. A successful production image build.
3. PostgreSQL readiness and successful `prisma migrate deploy` against a fresh Docker volume.
4. Application startup and a successful HTTP health response.
5. Development configuration startup with the expected bind mounts and hot-reload command.
6. `npm run verify:fast` for repository lint, types, quality checks, tests, and production build.

If Docker is unavailable in the execution environment, static Compose validation and repository
verification still run, and the unperformed runtime checks are reported explicitly.
