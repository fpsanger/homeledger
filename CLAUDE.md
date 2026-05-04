# Project

The tech stack of this project is:

- TypeScript
- PostgreSQL
- Drizzle ORM
- Docker
- Biome
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

- Domain
- Application
- Infrastructure
- UI

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

## 9. Commits

Use conventional commits:

- feat: new feature
- fix: bug fix
- refactor: code improvement
- test: tests
- chore: maintenance

---

## 10. Output Rules

- Be concise
- Be structured
- Do not over-engineer
- Add relevant changes to `CHANGELOG.md`