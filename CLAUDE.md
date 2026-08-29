# HomeLedger implementation guide

HomeLedger is a Next.js 14 App Router application using TypeScript, Prisma, PostgreSQL, Biome,
Jest, Testing Library, and Playwright.

## Sources of truth

- Read `SPEC.md` before changing financial or product behavior.
- Read `PRODUCT.md` and `DESIGN.md` before changing UI or UX.
- Use existing source and tests as implementation context, but do not let them override `SPEC.md`.
- Load historical plans or generated repository maps only when a task specifically needs them.

## Architecture

- `src/domain`: pure entities, services, errors, and repository contracts. It must not import
  application, infrastructure, React, Next.js, Prisma, or UI code.
- `src/application`: use-case orchestration; depends on domain contracts.
- `src/infrastructure`: Prisma repositories, database, parsers, and external integrations.
- `src/app`: pages and API routes.
- `src/components`: reusable UI.

Keep financial rules out of React components, API handlers, and Prisma mappings. All schema changes
require a versioned migration under `src/infrastructure/database/migrations/`.

## Development workflow

1. Clarify acceptance criteria and inspect the smallest relevant code surface.
2. For new behavior or bug fixes, write a failing direct test, implement the minimum change, and
   refactor while green.
3. Obtain human approval before material financial-rule, architecture, or schema decisions that
   are not already explicit in the request.
4. Avoid unrelated refactors and scope expansion.
5. Update `CHANGELOG.md` for user-visible, domain, schema, or operational changes.

Tests live under `tests/` and mirror source areas. E2E tests complement direct unit, component,
contract, and integration tests; they do not replace them.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test -- --runInBand
npm run verify:fast
npm run verify
```

Use focused Jest paths during development. `npm run verify` is the full pre-PR check and requires
PostgreSQL plus installed Playwright browsers.

## Pull requests

- Use a non-protected `<type>/<scope>-<description>` branch and Conventional Commit subjects.
- Open PRs against `develop` and use `.github/pull_request_template.md`.
- Never auto-merge. A human owns approval and merge.
- Deterministic CI is mandatory procedure. Request independent Codex review for financial logic,
  migrations/backfills, security-sensitive API changes, broad cross-layer refactors, unusually
  large or ambiguous diffs, or when a maintainer requests it.
- For low-risk documentation, configuration, copy, and well-contained changes, human review plus
  passing CI is sufficient.
- Credentials and machine-specific permissions belong outside the repository.
