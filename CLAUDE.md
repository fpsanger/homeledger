# Project

The tech stack of this project is:

- TypeScript
- Next.js 14 (App Router)
- PostgreSQL
- Prisma ORM
- Docker
- Biome
- Jest + ts-jest
- Migrations
- Vercel / Neon (future)

---

# Instructions

## 1. Mandatory Reading

Before working on new features or unclear tasks, read:

- `SPEC.md`
- `.claude/repo-map.md`

---

## 2. Architecture Rules

Follow Clean Architecture with the following layers:

- Domain → `src/domain/`
- Application → `src/application/`
- Infrastructure → `src/infrastructure/`
- UI → `src/app/` (Next.js App Router)

### Rules:

- Domain must not depend on any other layer
- Application depends only on Domain
- Infrastructure depends on Domain
- UI depends on Application
- No cross-layer violations

---

## 3. Code Rules

- Keep code simple
- Prefer readability over cleverness
- Avoid duplication (DRY)
- Respect Single Responsibility Principle (SRP)

---

## 4. Business Logic Definition

Business logic includes:

- Domain rules
- Core calculations
- Validation rules tied to the domain
- Use cases

Business logic MUST live in Domain or Application layers.

---

## 5. TDD Rules

All **domain logic MUST follow TDD**.

Other layers SHOULD use tests when appropriate.

### Required flow:

1. Write failing tests
2. Implement the minimal code to pass
3. Refactor if needed
4. Validate behavior

### Test location:

Tests mirror domain structure under `/tests/` (not co-located with `src/`).

Example: `src/domain/entities/Category.ts` → `tests/domain/entities/Category.test.ts`

### Test commands:

- Run all: `rtk jest`
- Run specific file: `rtk jest tests/domain/entities/Category.test.ts`
- Watch mode: `rtk jest --watch`

---

## 6. UI Rules

UI must:

- Collect input
- Display results

UI must NOT:

- Contain business logic

UI must interact only with the Application layer.

---

## 7. Error Handling

- Use explicit and meaningful error types
- Avoid generic errors
- Domain errors must be predictable and deterministic

---

## 8. Database & Migrations

- All schema changes must go through migrations
- Migrations must be versioned
- Never modify the database manually outside migrations


---
## 9. Branch Naming Convention

Branches must follow this pattern:

<type>/<scope>-<short-description>

Types:
- feature
- fix
- refactor
- chore
- test

Examples:
- feature/expenses-add-installments
- fix/api-null-pointer
- refactor/domain-cleanup

Rules:
- use kebab-case
- keep names short and descriptive
- no uppercase
---

## 10. Commits

Use conventional commits:

- feat: new feature
- fix: bug fix
- refactor: code improvement
- test: tests
- chore: maintenance

---

## 11. Output Rules

- Be concise
- Be structured
- Do not over-engineer
- Add relevant changes to `CHANGELOG.md`

## Design Context

Strategic + visual design specs: `PRODUCT.md` (register, users, brand personality, anti-references) and `DESIGN.md` (colors, typography, components — North Star: "The Ledger's Calm", single emerald hue, DM Serif Display for money only, flat-by-default cards). Read both before touching UI. Managed by the `impeccable` skill.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## 12. Agent Development Workflow

For non-trivial features, domain changes, financial-rule changes, or database changes, use the agent workflow below.

### Planning

Before implementation, use the `architect` agent.

The architect is read-only and must:

- understand the requirement
- inspect current behavior
- identify affected layers
- identify business-rule impact
- identify database impact
- identify required tests
- identify risks
- produce an implementation plan

Do not implement until the plan has:

`PLAN STATUS: READY`

For meaningful architectural or business-rule decisions, human approval should happen before implementation.

### Implementation

Implementation may be performed by an external implementation agent such as Codex.

The approved architect plan is the implementation contract.

Implementation agents must not silently:

- change architecture
- introduce new business rules
- expand scope
- perform unrelated refactors

If the plan is invalid or incomplete, report the conflict instead of improvising a new architecture.

### Testing

After domain or financial behavior changes, use the `test-writer` agent when additional behavioral coverage is required.

The test writer must derive expected behavior from `SPEC.md`, not merely from production implementation.

### Domain Review

After domain or financial changes, use the `domain-reviewer`.

The domain reviewer is read-only.

It validates:

- business-rule correctness
- financial integrity
- Clean Architecture
- domain purity
- relevant test coverage

A domain review fails when a BLOCKER or HIGH finding exists.

### Technical Review

Technical review should preferably be performed in a context separate from the implementation context.

Review for:

- bugs
- regressions
- architecture violations
- unnecessary complexity
- missing validation
- inefficient database access
- security issues
- missing tests

### Quality Gate

Before considering implementation complete run:

```bash
npm run quality