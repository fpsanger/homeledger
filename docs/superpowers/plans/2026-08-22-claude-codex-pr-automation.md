# Claude–Codex PR Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Homeledger so Claude opens verified Draft pull requests against `develop`,
GitHub Actions enforces deterministic quality gates, and Codex performs an independent automatic
review before human approval.

**Architecture:** Keep deterministic enforcement in the existing GitHub Actions workflows and use
the native Codex GitHub integration for generative review. Repository files define agent behavior,
pull request evidence, and CI behavior; a separate operations guide documents GitHub and Codex
Cloud settings that require administrator access.

**Tech Stack:** Markdown, GitHub Actions YAML, GitHub CLI, Node.js 22, npm, Jest, Biome, TypeScript,
Prisma, Playwright, Codex Cloud.

**Spec:** `docs/superpowers/specs/2026-08-22-claude-codex-pr-automation-design.md`

## Global Constraints

- Work only on `chore/claude-codex-pr-automation`; do not commit directly to `develop`.
- Pull requests target `develop` and start as Draft pull requests.
- Do not commit API keys, personal access tokens, or other credentials.
- Keep Codex review advisory at launch; deterministic CI and one human approval are enforced gates.
- Do not enable automatic merge.
- Preserve read-only workflow permissions unless a step demonstrably requires additional access.
- Run `npm run quality` before reporting implementation complete.

---

### Task 1: Define Codex review rules and Claude PR handoff

**Files:**

- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: repository architecture, testing, branch, commit, and quality rules already documented
  in both files.
- Produces: a repository-wide `## Code Review Rules` contract consumed by native Codex reviews and
  a `## Pull Request Handoff` contract consumed by Claude after implementation.

- [ ] **Step 1: Add repository-wide Codex review rules to `AGENTS.md`**

Append the following section:

```markdown
## Code Review Rules

Focus on actionable correctness, security, and regression risks. Do not report formatting or style
preferences already enforced by Biome.

- Treat imports from application, infrastructure, or UI into `src/domain/` as blocking Clean
  Architecture violations.
- Compare changed financial and domain behavior with `SPEC.md`; flag behavior that contradicts a
  documented rule or changes monetary calculations without direct tests.
- Require direct automated coverage for new behavior and regression fixes. Existing unrelated tests
  are not sufficient.
- Require every Prisma schema change to include a versioned migration under
  `src/infrastructure/database/migrations/`.
- Check changed API routes for input validation, authorization, data exposure, and unsafe database
  access.
- Require `CHANGELOG.md` updates for user-visible, domain, schema, or operational changes.
- Treat failed tests, Prisma validation, lint, typecheck, quality ratchet, or production build as
  blocking.
```

- [ ] **Step 2: Add the Claude pull request handoff contract to `CLAUDE.md`**

Append the following section:

```markdown
## 13. Pull Request Handoff

After completing an approved change:

1. Confirm the current branch follows `<type>/<scope>-<short-description>` and is not `develop`,
   `main`, or `master`.
2. Run `npm run quality`. Do not publish the change if it fails.
3. Commit with a Conventional Commit subject and push the current branch.
4. When GitHub CLI authentication is available, open a Draft pull request against `develop` with
   `gh pr create --draft --base develop`, using `.github/pull_request_template.md` as the content
   contract.
5. Report the pull request URL and any CI or Codex findings. Address findings on the same branch
   without expanding the approved scope.

Never auto-merge. Never place credentials in commands, commits, pull request bodies, or repository
files. If push or pull request creation is not authorized, preserve the branch and commits and
report the exact manual command the maintainer should run.
```

- [ ] **Step 3: Check instruction consistency**

Run:

```bash
rg -n 'develop|Draft|npm run quality|auto-merge|Code Review Rules' AGENTS.md CLAUDE.md
```

Expected: both files consistently target `develop`, require the quality gate, preserve human merge
authority, and contain no contradictory handoff instructions.

- [ ] **Step 4: Validate Markdown changes**

Run:

```bash
git diff --check -- AGENTS.md CLAUDE.md
```

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 5: Commit the agent contracts**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "chore: define agent PR handoff"
```

### Task 2: Add the pull request evidence template

**Files:**

- Create: `.github/pull_request_template.md`

**Interfaces:**

- Consumes: the Claude handoff contract from Task 1 and existing repository quality requirements.
- Produces: the standard pull request body used by humans and implementation agents.

- [ ] **Step 1: Create `.github/pull_request_template.md`**

Use this exact structure:

```markdown
## Summary

<!-- What changed and why? -->

## Related task

<!-- Link the issue/task or write "Not linked". -->

## Implementation notes

<!-- Important design decisions, affected layers, and intentionally excluded scope. -->

## Verification

- [ ] `npm run quality`
- [ ] Focused tests for changed behavior

<!-- Record commands and results. Do not check an item that was not run successfully. -->

## Database and migrations

<!-- Describe schema/migration impact or write "None". -->

## Screenshots

<!-- Required for UI changes. Otherwise write "Not applicable". -->

## Risks and rollback

<!-- Describe operational risks and how to revert safely, or write "Low risk / revert PR". -->

## Checklist

- [ ] The change stays within the approved scope.
- [ ] New behavior and regression fixes followed TDD and have direct automated coverage.
- [ ] Prisma schema changes include a versioned migration.
- [ ] `CHANGELOG.md` was updated when the change is user-visible, domain, schema, or operational.
- [ ] Documentation was updated where behavior or operations changed.
- [ ] No credentials or sensitive data were added.
- [ ] This pull request targets `develop` and remains Draft until required checks and blocking
      findings are resolved.
```

- [ ] **Step 2: Validate template completeness**

Run:

```bash
rg -n 'Summary|Related task|Implementation notes|Verification|Database and migrations|Screenshots|Risks and rollback|TDD|CHANGELOG|develop' .github/pull_request_template.md
```

Expected: every required evidence section and checklist policy appears in the output.

- [ ] **Step 3: Validate Markdown whitespace**

Run:

```bash
git diff --check -- .github/pull_request_template.md
```

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 4: Commit the pull request template**

```bash
git add .github/pull_request_template.md
git commit -m "chore: add pull request template"
```

### Task 3: Make deterministic CI checks enforceable

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/playwright.yml`

**Interfaces:**

- Consumes: npm scripts from `package.json` and pull requests targeting `develop`.
- Produces: blocking CI results for lint, typecheck, unit tests, quality ratchet, Prisma validation,
  production build, and Playwright tests.

- [ ] **Step 1: Make lint and typecheck failures block `ci.yml`**

Remove these two lines and make no other job-permission expansion:

```yaml
continue-on-error: true
```

The first removal is from `jobs.lint.steps[name="Run Biome checks"]`; the second is from
`jobs.typecheck.steps[name="Check TypeScript"]`.

- [ ] **Step 2: Align `playwright.yml` with the protected branch and runtime**

Replace its trigger and Node setup with:

```yaml
name: Playwright Tests

on:
  pull_request:
    branches:
      - develop
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: playwright-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

- [ ] **Step 3: Perform structural workflow assertions**

Run:

```bash
test "$(rg -c 'continue-on-error' .github/workflows/ci.yml)" -eq 0
rg -n 'develop|workflow_dispatch|contents: read|node-version: 22.x|npm ci|npx playwright test' .github/workflows/playwright.yml
```

Expected: the first command exits 0; the second shows all required trigger, permission, runtime,
installation, and test lines.

- [ ] **Step 4: Parse both workflow files as YAML**

Run the repository's available YAML parser if one is already installed. If no parser is available,
use Ruby's standard YAML parser without installing a dependency:

```bash
ruby -e 'require "yaml"; ARGV.each { |path| YAML.load_file(path, aliases: true); puts "valid: #{path}" }' .github/workflows/ci.yml .github/workflows/playwright.yml
```

Expected: `valid:` is printed for both files and the command exits 0.

- [ ] **Step 5: Run the checks that are changing from advisory to blocking**

Run:

```bash
npm run lint
npm run typecheck
```

Expected: both commands exit 0. If either fails because the existing branch already violates the
check, stop and report the baseline failure instead of weakening the workflow.

- [ ] **Step 6: Commit CI enforcement**

```bash
git add .github/workflows/ci.yml .github/workflows/playwright.yml
git commit -m "ci: enforce pull request quality gates"
```

### Task 4: Document administrator setup and rollout

**Files:**

- Create: `docs/claude-codex-pr-workflow.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: repository agent contracts, workflow job names, and the native Codex GitHub integration.
- Produces: a reproducible administrator checklist for GitHub/Codex settings and a user-visible
  operational changelog entry.

- [ ] **Step 1: Create `docs/claude-codex-pr-workflow.md`**

Document these sections and exact settings:

```markdown
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
```

- [ ] **Step 2: Add an Unreleased changelog entry**

Under the current Unreleased section of `CHANGELOG.md`, add an operational entry stating that the
repository now documents and enforces the Claude-to-Draft-PR, CI, Codex-review, and human-approval
workflow. Preserve the file's existing format and headings.

- [ ] **Step 3: Verify guide consistency against workflows**

Run:

```bash
rg -n '^    name:|^  [a-z-]+:$' .github/workflows/ci.yml .github/workflows/playwright.yml
rg -n 'Tests|Quality ratchet|Database|Lint|Typecheck|Build|Playwright Tests|develop|Automatic reviews|human' docs/claude-codex-pr-workflow.md
```

Expected: the guide names every required check present in the workflows and consistently describes
`develop` as the protected target with human approval.

- [ ] **Step 4: Validate documentation whitespace**

Run:

```bash
git diff --check -- docs/claude-codex-pr-workflow.md CHANGELOG.md
```

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 5: Commit operations documentation**

```bash
git add docs/claude-codex-pr-workflow.md CHANGELOG.md
git commit -m "docs: add agent pull request workflow"
```

### Task 5: Run the complete repository verification

**Files:**

- Verify only: all files changed by Tasks 1–4

**Interfaces:**

- Consumes: agent contracts, PR template, CI workflows, and operations guide.
- Produces: evidence that the branch is internally consistent and passes Homeledger's completion
  gate before a Draft pull request is opened.

- [ ] **Step 1: Confirm branch isolation and intended diff**

Run:

```bash
git branch --show-current
git status --short
git diff --stat develop...HEAD
git diff --name-only develop...HEAD
```

Expected: current branch is `chore/claude-codex-pr-automation`; only the approved specification,
plan, agent instructions, PR template, workflows, operations guide, and changelog are listed.

- [ ] **Step 2: Scan for accidentally committed credentials**

Run:

```bash
git diff develop...HEAD -- . ':!package-lock.json' | rg -n 'OPENAI_API_KEY=|ghp_[A-Za-z0-9]|github_pat_|sk-[A-Za-z0-9]'
```

Expected: no output and `rg` exit code 1. Any match must be investigated and removed before
continuing.

- [ ] **Step 3: Run the repository completion gate**

Run:

```bash
npm run quality
```

Expected: lint, typecheck, quality-tool tests, quality ratchet, and production build all complete
successfully.

- [ ] **Step 4: Run the complete Jest suite explicitly**

`npm run quality` does not currently invoke the full Jest suite, so run:

```bash
npm test -- --runInBand
```

Expected: all Jest suites pass with zero failures.

- [ ] **Step 5: Re-parse workflows and inspect the final diff**

Run:

```bash
ruby -e 'require "yaml"; ARGV.each { |path| YAML.load_file(path, aliases: true); puts "valid: #{path}" }' .github/workflows/ci.yml .github/workflows/playwright.yml
git diff --check develop...HEAD
git diff --stat develop...HEAD
```

Expected: both workflow files parse, the diff has no whitespace errors, and the final stat contains
only expected files.

- [ ] **Step 6: Commit the implementation plan if still uncommitted**

```bash
git add docs/superpowers/plans/2026-08-22-claude-codex-pr-automation.md
git commit -m "docs: plan Claude Codex PR automation"
```

- [ ] **Step 7: Prepare the Draft pull request handoff**

Do not push or open a pull request without authenticated GitHub access and the user's authorization.
When authorized, use:

```bash
git push -u origin chore/claude-codex-pr-automation
gh pr create --draft --base develop --title "chore: automate Claude and Codex PR workflow"
```

Expected: a single Draft pull request is created against `develop`. Report its URL, CI state, and
whether Codex automatic review has started. Do not enable auto-merge.
