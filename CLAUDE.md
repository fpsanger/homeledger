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