# Homeledger

Homeledger is a personal finance app for a single household. It tracks people, incomes, expenses, categories, recurring transactions, credit card purchases, installments, and monthly/annual financial views.

The project intentionally has no login, invitations, or multi-workspace model. The household is fixed, and every financial record belongs to one person.

## Status

Homeledger is a private personal project. The basic product surface is implemented and the repository is currently in the `2.1.x` phase: useful for local development, still evolving, and not yet hardened as a public SaaS product.

## Features

- Manage household people.
- Register expenses and incomes.
- Organize transactions with hierarchical categories.
- Validate expense categories as leaf categories.
- Detect possible duplicate expenses and credit card purchases.
- Manage recurring monthly transactions.
- Manage credit cards with fixed or variable closure dates.
- Register credit card purchases with installments.
- Mark installments as paid or unpaid, including bulk actions.
- Cancel installment purchases without affecting historical records incorrectly.
- View monthly movements across transactions and credit card installments.
- View annual reports and dashboard cards.
- Install the app as a PWA.
- Use toast notifications for user feedback.

## Tech Stack

- TypeScript
- Next.js 14 with App Router
- React 18
- Tailwind CSS
- Prisma 7
- PostgreSQL 16
- Jest with ts-jest
- Biome
- Docker Compose

## Host-based development

Use Node.js 22:

```bash
nvm use
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose -f compose.dev.yaml up -d postgres
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Docker development

Docker Engine or Docker Desktop with Docker Compose v2 is required. The development stack runs
Node.js 22, the Next.js development server with hot reload, and PostgreSQL 16 in containers.

Create the local environment file if it does not exist:

```bash
cp .env.example .env
```

Apply migrations explicitly, then start the development stack:

```bash
npm run docker:dev:migrate
npm run docker:dev
```

The app is available at `http://localhost:3000`, and PostgreSQL is exposed on host port `5433` by
default. Source files are mounted from the host; container volumes isolate `node_modules` and the
Next.js build cache.

To stop the development stack:

```bash
docker compose -f compose.dev.yaml down
```

## Production-like Docker stack

The default Compose stack builds the optimized Next.js standalone image, runs the app as a
non-root user, and keeps PostgreSQL on the internal Docker network. Apply migrations before
starting or updating the application:

```bash
npm run docker:build
npm run docker:migrate
npm run docker:up
```

The application health endpoint is `http://localhost:3000/api/health`. Inspect status and logs with:

```bash
docker compose ps
docker compose logs -f app
```

Stop the stack without deleting database data:

```bash
npm run docker:down
```

Compose defaults to the local `homeledger` database credentials. Override `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`, and optionally `APP_PORT` in non-local environments. Do not use
the development defaults for an exposed deployment, and do not commit production secrets.

Migrations are intentionally separate from application startup. This makes failures visible and
prevents multiple application instances from racing to change the database schema.

To reset a disposable local Docker database, run the appropriate command below. **These commands
permanently delete the corresponding PostgreSQL volume and all data stored in it.**

```bash
docker compose down --volumes
docker compose -f compose.dev.yaml down --volumes
```

## Environment

The local database defaults to:

```env
DATABASE_URL="postgresql://homeledger:homeledger@localhost:5433/homeledger"
```

The Prisma schema lives at:

```text
src/infrastructure/database/schema.prisma
```

Migrations live at:

```text
src/infrastructure/database/migrations
```

## Scripts

```bash
npm run dev      # Start the Next.js dev server
npm run build    # Build the production app
npm run start    # Start the production server
npm run docker:dev # Start the containerized development stack
npm run docker:dev:migrate # Apply migrations to the development database
npm run docker:build # Build the production-like application image
npm run docker:migrate # Apply migrations to the production-like database
npm run docker:up # Start the production-like stack
npm run docker:down # Stop the production-like stack without deleting data
npm run lint     # Run Biome checks against src and tests
npm run format   # Format src and tests with Biome
npm test         # Run Jest tests
npm run verify:fast # Run all non-E2E quality gates
npm run verify   # Run verify:fast plus Playwright
```

### Quality ratchet

Run `npm run quality:ratchet` to generate the current quality snapshot and compare it with the
versioned baseline. Regressions fail the command, while improvements are reported without changing
the baseline automatically.

After reviewing an improvement, run `npm run quality:baseline:update` to generate a fresh snapshot
and promote it. The command refuses snapshots containing regressions and copies only the protected
coverage and violation metrics into `quality-baseline.json`. Review and commit the baseline diff
with the change that produced the improvement.

## CI and Releases

GitHub Actions validates pull requests targeting `develop` or `master`. The repository treats the
following checks as mandatory procedure:

- Jest tests.
- Prisma schema validation.
- Applying every Prisma migration to an empty PostgreSQL 16 database.
- Biome linting and formatting checks.
- TypeScript checks.
- Quality-ratchet validation.
- Building the production application.
- Playwright tests for pull requests targeting `develop`.

This private repository's current GitHub plan does not provide branch protection. CI failures are
therefore reported but do not technically prevent a maintainer from merging; the maintainer must
confirm every applicable check before merge.

Changes normally flow through:

```text
feature/* or fix/* -> pull request -> develop -> pull request -> master
```

Direct pushes to `develop` and `master` should be blocked with GitHub rulesets. Before merging
`develop` into `master`, update the version in `package.json` and move the relevant changelog
entries from `[Unreleased]` into that version. A successful merge from `develop` into `master`
creates the matching Git tag and GitHub Release automatically. The version must be newer than the
latest existing Git tag.

Dependabot checks npm and GitHub Actions updates weekly without adding a noisy vulnerability gate
to every pull request.

## Architecture

The project follows Clean Architecture:

```text
src/domain          Pure business rules, entities, services, repository contracts
src/application     Use cases that orchestrate domain behavior
src/infrastructure  Prisma client, database schema, repository implementations
src/app             Next.js pages, layouts, and API routes
src/components      UI components
tests               Domain, application, and repository tests
```

Rules of thumb:

- Domain code must not depend on application, infrastructure, or UI code.
- Application code depends on the domain layer and coordinates use cases.
- Infrastructure implements domain repository interfaces.
- UI and API routes should call application use cases instead of embedding business rules.

## Development Notes

- Domain behavior should be developed with TDD.
- Schema changes must go through Prisma migrations.
- Keep financial rules in `src/domain` or `src/application`.
- Keep UI components focused on collecting input and displaying results.
- Update `CHANGELOG.md` when user-visible behavior, domain rules, database schema, or operational workflows change.

## Product Model

Homeledger is built around a few core concepts:

- **Person:** a household member who owns financial records.
- **Transaction:** an income or expense.
- **Category:** an optional hierarchical classification for financial records.
- **Credit card purchase:** a purchase that can generate one or more installments.
- **Installment:** a monthly amount that affects a specific monthly view.
- **Recurring transaction:** a monthly rule for repeated income or expense.
- **Monthly view:** the financial picture for one month, including transactions and due installments.

## Roadmap

Near-term ideas:

- Improve seed/import workflows.
- Add more confidence around UI behavior with focused tests.
- Refine dashboards and reporting flows.
- Prepare deployment notes for Vercel and Neon.
- Keep documentation aligned with the current product surface.
