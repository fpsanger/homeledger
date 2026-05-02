# Project Instructions

## 1. Mandatory Reading

Before any task, ALWAYS read:

- SPEC.md
- .claude/repo-map.md

---

## 2. Skill Usage

Use the correct skill:

- plan-task → new / unclear tasks
- write-tests → before domain logic
- implement-task → implementation
- validate-task → after implementation

---

## 3. Architecture Rules

- Follow Clean Architecture
- Domain is independent
- No cross-layer violations

---

## 4. Code Rules

- Keep code simple
- Prefer readability over cleverness
- Avoid duplication
- Respect single responsibility

---

## 5. TDD Rules

- Domain logic MUST start with tests
- Implementation only after tests

All business logic MUST follow TDD.

### Required flow:

1. Use write-tests skill
2. Write failing tests
3. Use implement-task skill
4. Implement code to pass tests
5. Use validate-task skill

---

## 6. UI Rules

UI must:
- collect input
- display results

UI must NOT:
- implement business rules

---

## 7. Output Rules

- Be concise
- Be structured
- Do not over-engineer
- Add revelant changes to `CHANGELOG.md` files