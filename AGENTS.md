# Repository guidelines

HomeLedger is a Next.js 14 App Router application organized with Clean Architecture.

## Context routing

- Consult `SPEC.md` for financial and product behavior.
- Consult `PRODUCT.md` and `DESIGN.md` only for UI or UX work.
- Inspect relevant source and tests directly. Generated maps and historical plans are optional
  aids, not sources of truth.

## Architecture

- `src/domain`: pure business entities, services, errors, and repository contracts. No imports
  from application, infrastructure, UI, React, Next.js, or Prisma.
- `src/application`: orchestration over domain contracts.
- `src/infrastructure`: Prisma/database implementations, parsers, and integrations.
- `src/app`: routes and pages. `src/components`: reusable UI.
- Business and monetary rules belong in domain or application code.
- Prisma schema changes require a versioned migration in
  `src/infrastructure/database/migrations/`.

TypeScript is strict and Biome owns formatting and lint rules. Tests live under `tests/` and mirror
source areas. New behavior and regression fixes require direct automated coverage; financial and
domain behavior should be developed test-first.

## Canonical validation

```bash
npm run verify:fast  # lint, typecheck, quality tooling, Jest, build
npm run verify       # verify:fast plus Playwright
```

Use focused tests while iterating. Update `CHANGELOG.md` for user-visible, domain, schema, or
operational changes.

## Review priorities

Report only actionable correctness, security, data-integrity, architecture, or regression risks.
Do not report formatting preferences enforced by Biome.

Treat these as blocking:

- Domain imports an outer layer or performs infrastructure/framework side effects.
- Changed financial behavior contradicts `SPEC.md` or lacks direct tests.
- A Prisma schema change lacks a versioned migration.
- An API change lacks appropriate validation or exposes data/unsafe database access.
- Required tests, migration validation, lint, typecheck, quality ratchet, or build fail.

Order findings by severity and cite exact files and lines. If no blocking findings exist, say so
and identify any verification not performed.

## Git and pull requests

Use `<type>/<scope>-<description>` branches, Conventional Commit subjects, and PRs against
`develop`. Never auto-merge; a human owns the merge decision. Independent Codex review is
recommended for financial rules, migrations/backfills, security-sensitive APIs, broad cross-layer
refactors, and large or ambiguous diffs. It is optional for low-risk changes when CI and human
review are sufficient.
