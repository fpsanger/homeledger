# Claude–Codex pull request workflow

## What the repository configures

- Claude implements on a non-protected branch and opens a Draft PR against `develop`.
- GitHub Actions runs deterministic checks.
- Codex reviews the PR using `AGENTS.md`.
- A human remains responsible for approval and merge.

## One-time Codex setup

1. Connect this GitHub repository to Codex Cloud.
2. In Codex settings, enable Code review for the repository.
3. Enable Automatic reviews.
4. Confirm a Draft test PR receives a Codex review or acknowledgement.

## One-time GitHub setup

Create a ruleset or branch-protection rule targeting `develop` with:

- Require a pull request before merging.
- Require one approving human review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merging.
- Require the Tests, Quality ratchet, Database, Lint, Typecheck, Build, and Playwright Tests status
  checks.
- Require the branch to be up to date before merging.
- Block force pushes and branch deletion.
- Do not enable automatic merge during the initial rollout.

## Claude prerequisites

Claude needs Git and authenticated GitHub CLI access to push and open a PR. Credentials belong in
the execution environment, never in this repository. Without authorization, Claude must stop after
creating local commits and provide the manual push and `gh pr create --draft --base develop`
commands.

## Operating the workflow

1. Request and approve a scoped implementation.
2. Claude implements, runs `npm run quality`, pushes, and opens a Draft PR.
3. Wait for deterministic CI and Codex review.
4. Resolve failures and credible review findings on the same branch.
5. Mark the PR ready after required checks pass and blocking findings are resolved.
6. Obtain human approval and merge.

## Failure policy

- CI failure: keep the PR in Draft and fix the failure.
- Credible Codex finding: fix it or have a human dismiss it with rationale.
- Codex outage: do not treat the PR as fully reviewed.
- Missing GitHub authorization: keep local work intact and hand off the exact manual commands.
- Duplicate PR: update the existing PR; do not create another one for the same branch.

## Initial rollout

Run one low-risk Draft PR through the complete workflow. Keep Codex advisory and automatic merge
disabled until maintainers have observed review quality and false-positive rates.
