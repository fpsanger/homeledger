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

Layering, circular dependencies, cyclomatic complexity, file/function size, and coverage are
enforced mechanically by `scripts/quality/*.cjs` (`npm run quality:ratchet`), not by convention
alone — see `quality-baseline.json` for current thresholds.

## Canonical validation

```bash
npm run agent:check  # lint, typecheck, Jest/coverage, quality ratchet, build, Prisma validation
npm run verify        # agent:check plus Playwright e2e (requires Postgres + installed browsers)
npm run pr:review     # review committed and local changes for migration/test/harness risks
```

`npm run agent:check` is the required gate before declaring any implementation complete. Use
focused Jest/Playwright paths while iterating; run the full command before finishing.

## Agent completion contract

1. Understand the task.
2. Read only the documentation relevant to it (this file routes you to the rest).
3. Inspect the existing implementation before modifying it.
4. Implement the smallest appropriate change.
5. Run `npm run agent:check`.
6. If it fails, inspect the failures and fix the implementation.
7. Repeat steps 5-6 until it passes.
8. Review the diff for unnecessary changes.
9. Only then declare the implementation complete.

Never:

- Bypass or skip a failing check to get past it.
- Lower a coverage baseline or raise a complexity/size threshold merely to pass.
- Disable or delete a test to make a run go green.
- Suppress an architecture violation without a documented justification.
- Claim success without having actually run `npm run agent:check`.

Update `CHANGELOG.md` for user-visible, domain, schema, or operational changes.

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

The `pr-diff-review` CI job (`npm run pr:review`, `scripts/pr-checks/analyze-diff.cjs`) mechanically
pre-checks a subset of the above on every PR against `develop`: schema-without-migration (blocking),
financial-logic-without-tests, API-route-without-validation-or-tests, and any touch to a protected
harness file (all three flagged, not blocked — false-positive-prone heuristics). It complements, and
does not replace, human/Codex judgment on the rest of this list.

## Mutation testing

`npm run mutation:test` runs the financial-critical Stryker scope from `stryker.config.mjs`.
It is advisory and runs only weekly or manually; `npm run mutation:report` summarizes the result.

## Deployment

`develop` deploys itself. After CI goes green on a push to `develop`,
`.github/workflows/deploy.yml` runs on a self-hosted runner on the Tailscale-connected Linux host
and `deploy/deploy.sh` builds a new release, applies migrations, swaps it in atomically, and rolls
back if `/api/health` does not answer. Full setup and operations are in `docs/deployment.md`.

Two consequences for any change you make:

- **Migrations must be backward-compatible with the previous release.** A rollback reverts code, not
  schema, and migrations have already been applied by the time a health check can fail. Add columns
  and tables; drop them in a later release.
- **The deployed app has no authentication** — the tailnet is the access control. Never add a path
  that assumes a logged-in user, and never expose the instance publicly (no `tailscale funnel`).

## Git and pull requests

Use `<type>/<scope>-<description>` branches, Conventional Commit subjects, and PRs against
`develop`. Never auto-merge; a human owns the merge decision. Independent Codex review is
recommended for financial rules, migrations/backfills, security-sensitive APIs, broad cross-layer
refactors, and large or ambiguous diffs. It is optional for low-risk changes when CI and human
review are sufficient.
