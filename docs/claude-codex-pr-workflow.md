# Claude–Codex pull request workflow

## What the repository configures

- Repository instructions and templates direct Claude to implement on a non-protected branch and
  open a Draft PR against `develop`.
- GitHub Actions executes and reports the deterministic checks defined in the repository.
- The repository provides `npm run verify` as the complete local verification command. It runs the
  quality gate, the full Jest suite, and Playwright end-to-end tests.

## What administrators enable

- Codex administrators connect the repository and enable Code review. A maintainer can request a
  review by commenting `@codex review` on a pull request; this flow has been tested successfully.
- GitHub administrators can protect `develop` with the ruleset described below when the repository
  plan supports rulesets or branch protection for private repositories.
- Without branch protection, GitHub Actions reports failures but does not prevent a maintainer from
  merging. A human remains responsible for checking the results, approving, and merging.

## One-time Codex setup

1. Connect this GitHub repository to Codex Cloud.
2. In Codex settings, enable Code review for the repository.
3. Comment `@codex review` on a Draft test pull request.
4. Confirm that Codex reviews the pull request using the rules in `AGENTS.md`.

Automatic reviews are optional and have not been validated for this repository. Do not document or
treat them as an active merge gate until they have been enabled and tested separately.

## One-time GitHub setup

If the repository plan supports it, create a ruleset or branch-protection rule targeting `develop`
with:

- For a ruleset, set enforcement status to **Active**. Do not place Claude, Codex, their apps, or
  any other agent identity on a bypass list.
- Require a pull request before merging.
- Require one approving human review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merging.
- Require the Tests, Quality ratchet, Database, Lint, Typecheck, Build, and Playwright Tests status
  checks, with GitHub Actions selected as the expected source for each check.
- Require the branch to be up to date before merging.
- Block force pushes and branch deletion.
- For branch protection, enable **Do not allow bypassing the above settings** and configure no agent
  actor to bypass required pull requests. Any break-glass identity must be human-only and explicitly
  documented by the administrators.
- Do not enable automatic merge during the initial rollout.

For a private repository whose GitHub plan does not support these controls, the settings above are
a future hardening checklist, not active enforcement. Until they are available, maintainers must
manually confirm that every reported check passed and that the requested Codex review has no
unresolved blocking findings before merging.

## Claude prerequisites

Claude needs Git and authenticated GitHub CLI access to push and open a PR. Use a dedicated,
least-privilege agent credential scoped only to this repository and the permissions needed to push
its branch and create pull requests; it must not have administration or ruleset-bypass privileges.
Credentials belong in the execution environment, never in this repository. Without authorization,
Claude must stop after creating local commits and provide the manual push and
`gh pr create --draft --base develop` commands.

## Operating the workflow

1. Request and approve a scoped implementation.
2. Claude implements, runs `npm run verify`, pushes, and opens a Draft PR.
3. Wait for deterministic CI, then comment `@codex review` to request the Codex review.
4. Resolve failures and credible review findings on the same branch.
5. Mark the PR ready after required checks pass and blocking findings are resolved.
6. Obtain human approval and merge.

`npm run verify` requires the local PostgreSQL service to be available and the Playwright browsers
to be installed. Run `docker compose up -d` and `npx playwright install` when preparing a new local
environment.

## Failure policy

- CI failure: keep the PR in Draft and fix the failure. Without branch protection, do not merge even
  though GitHub may still allow it.
- Credible Codex finding: fix it or have a human dismiss it with rationale.
- Missing or failed Codex review: retry `@codex review`; do not treat the PR as fully reviewed.
- Missing GitHub authorization: keep local work intact and hand off the exact manual commands.
- Duplicate PR: update the existing PR; do not create another one for the same branch.

## Initial rollout

The manual `@codex review` trigger has been validated. Keep Codex advisory and automatic merge
disabled until maintainers have observed review quality and false-positive rates. Treat the CI
checks as mandatory procedure, but not technically enforced merge gates, until branch protection is
available and enabled.
