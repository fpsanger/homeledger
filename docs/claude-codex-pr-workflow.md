# AI-assisted pull request workflow

HomeLedger uses one implementation agent, deterministic CI, risk-based independent review, and a
human merge decision.

## Responsibilities

- **Developer:** defines acceptance criteria, approves material financial/schema decisions, reviews
  the PR, and merges.
- **Claude Code:** plans when needed, implements, writes direct tests, runs local validation, and
  prepares the PR.
- **GitHub Actions:** runs deterministic tests, quality checks, database migration replay, build,
  and E2E validation.
- **Codex:** provides an independent review when the change's risk justifies the extra context,
  latency, and cost.

## Normal flow

1. Define scope and acceptance criteria.
2. Implement on a non-protected branch using direct tests for changed behavior.
3. Run `npm run verify:fast` during final local iteration.
4. Run `npm run verify` before PR publication when PostgreSQL and Playwright are available.
5. Open a ready-for-review PR against `develop` using `.github/pull_request_template.md`.
6. Wait for all applicable GitHub Actions checks.
7. Request Codex review when the risk policy below applies.
8. Resolve failures and credible findings on the same branch.
9. Obtain human approval and merge. Never auto-merge.

## Independent-review policy

Request Codex review for:

- monetary calculations or financial business rules;
- Prisma migrations, backfills, or risky persistence mappings;
- security-sensitive API or data-exposure changes;
- broad cross-layer refactors;
- large, ambiguous, or unusually difficult diffs;
- an explicit maintainer request.

For documentation, repository configuration, UI copy/style, dependency metadata, and small
well-contained changes, passing CI plus human review is sufficient. Codex findings are advisory;
deterministic checks and the human merge decision remain authoritative.

## GitHub enforcement limitation

The repository is private and its current GitHub plan does not support branch protection. GitHub
Actions reports failures but cannot prevent a maintainer from merging. Until protection becomes
available, the maintainer must manually confirm the applicable Tests and quality ratchet, Database,
Lint, Typecheck, Build, and Playwright statuses.

If branch protection becomes available, require a PR, one human approval, conversation resolution,
up-to-date required checks, and no force pushes or agent bypass identities.

## Credentials and failures

Agent credentials must be least-privilege, repository-scoped, and stored only in the execution
environment. A missing credential must result in a manual handoff, never a committed secret.

- CI failure: keep the PR open and fix it.
- Credible AI finding: fix it or record a human dismissal rationale.
- Missing optional Codex review on a low-risk PR: continue with CI and human review.
- Missing required risk-based review: request it or obtain an explicit human decision to proceed.
- Duplicate PR: update the existing PR.
