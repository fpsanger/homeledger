# Claude–Codex PR Automation Design

## Objective

Automate Homeledger's delivery workflow so Claude can implement a requested change and open a
Draft pull request, GitHub Actions can enforce deterministic quality checks, and Codex can perform
an independent automatic review before a human approves the merge.

## Scope

This change configures the repository and documents the external GitHub/Codex settings required
for the workflow. It does not automatically merge pull requests, grant agents unrestricted GitHub
access, or make an AI review the sole merge gate.

## Delivery Flow

1. Claude creates a branch using `<type>/<scope>-<description>`.
2. Claude follows TDD for behavior changes and runs `npm run quality` before publishing work.
3. Claude commits with Conventional Commit messages, pushes the branch, and opens a Draft pull
   request against `develop` using the repository template.
4. GitHub Actions runs tests, quality checks, database validation, typechecking, build, and the
   Playwright suite configured for the target branch.
5. Codex automatically reviews the pull request using the applicable `AGENTS.md` rules.
6. Claude or a human addresses actionable findings and pushes corrections to the same branch.
7. The pull request is marked ready only after required CI checks pass and blocking review findings
   are resolved.
8. A human approves and merges the pull request.

## Repository Changes

### Codex review policy

Add a `## Code Review Rules` section to the root `AGENTS.md`. The rules must direct Codex to focus
on actionable defects and verify:

- Clean Architecture dependency boundaries;
- financial and domain-rule correctness against `SPEC.md`;
- direct automated coverage for changed behavior and regression fixes;
- versioned Prisma migrations for schema changes;
- API validation, authorization, security, and database-access regressions;
- user-visible, domain, schema, and operational entries in `CHANGELOG.md`;
- successful repository quality requirements.

The review rules must prioritize correctness and high-signal findings rather than style preferences
already enforced by Biome.

### Claude delivery policy

Extend `CLAUDE.md` with an explicit pull request handoff contract. Claude must:

- use the existing branch and commit conventions;
- run `npm run quality` before opening a pull request;
- open a Draft pull request against `develop` with `gh pr create --draft` when GitHub CLI access is
  available;
- populate the repository pull request template with behavior, verification, migration, changelog,
  and screenshot information;
- never auto-merge;
- report missing GitHub authentication or permissions rather than bypassing the workflow;
- respond to Codex findings on the same branch without expanding the approved scope.

These instructions describe the expected behavior but do not store credentials or embed tokens in
the repository.

### Pull request template

Create `.github/pull_request_template.md` with sections for:

- summary and motivation;
- linked issue or task;
- implementation notes;
- verification commands and results;
- database or migration impact;
- screenshots for UI changes;
- risks and rollback considerations;
- checklist covering TDD, quality, changelog, migrations, documentation, and scope.

The template must work for both human-authored and agent-authored pull requests.

### Continuous integration

Retain the existing CI jobs and make deterministic failures enforceable:

- remove `continue-on-error` from the lint job;
- remove `continue-on-error` from the typecheck job;
- keep tests, quality ratchet, Prisma validation/migration deployment, and production build as
  failing checks;
- keep permissions read-only unless a workflow step explicitly requires more access;
- align the Playwright workflow with pull requests targeting `develop` and use Node.js 22;
- preserve manual execution where already available.

The Codex review will use the native Codex GitHub integration rather than an API-key-backed GitHub
Action. This keeps generative review separate from deterministic CI and avoids storing an OpenAI
API key solely for review.

### Operations guide

Add a concise repository document describing the one-time settings that cannot be committed:

- connect the repository to Codex Cloud;
- enable Codex automatic reviews;
- create a GitHub ruleset or branch-protection rule for `develop`;
- require pull requests, the deterministic status checks, one human approval, and resolved review
  conversations;
- block force pushes and branch deletion;
- leave automatic merging disabled initially.

The guide must distinguish repository-managed configuration from settings that an administrator
must enable in GitHub or Codex Cloud.

## Security and Permissions

- No API keys, personal access tokens, or other credentials are committed.
- CI workflows use minimum GitHub permissions.
- Pull requests from agents remain visible and reviewable before merge.
- Human approval remains mandatory for `develop`.
- Claude must stop and report when branch push or pull request creation requires unavailable
  authorization.
- Codex review is advisory at launch; deterministic CI and human approval are the enforced gates.

## Failure Handling

- If a deterministic check fails, the pull request stays in Draft and the failure must be fixed on
  the same branch.
- If Codex reports a credible blocking defect, the finding must be resolved or explicitly dismissed
  by a human with rationale.
- If Codex Cloud is temporarily unavailable, CI still runs, but the pull request must not be treated
  as fully reviewed.
- If GitHub CLI authentication is missing, Claude leaves the local branch and commits intact and
  reports the exact manual push/PR step required.
- Automation must not retry indefinitely or create duplicate pull requests.

## Verification

Repository changes are verified by:

- parsing workflow YAML through GitHub-compatible syntax checks where locally available;
- running `npm run lint` and `npm run typecheck` to ensure the newly blocking checks currently pass;
- running `npm run quality` as the repository's completion gate;
- inspecting the final diff for credentials and excessive workflow permissions;
- confirming that the pull request template and agent instructions consistently target `develop`;
- confirming through a test Draft PR after the external GitHub and Codex settings are enabled.

The test Draft PR is an operational acceptance step and is not created automatically as part of
the repository edit.

## Rollout

Roll out in two phases:

1. Enable Draft PR creation, deterministic required checks, native Codex review, and mandatory
   human approval.
2. After observing review quality and false-positive rates, consider automatically marking Draft
   pull requests ready. Automatic merge remains outside this design and requires a separate
   decision.

## Success Criteria

- Claude has unambiguous instructions for opening a Draft PR against `develop`.
- Every PR against `develop` runs enforceable deterministic checks.
- Codex automatically reviews new PRs using repository-specific guidance.
- No agent can merge solely because another agent approved the change.
- A maintainer can understand and reproduce all required external configuration from the operations
  guide.
