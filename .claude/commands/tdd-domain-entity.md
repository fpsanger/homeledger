# TDD Domain Entity

Enforce TDD flow for a new domain entity in this project.

## Usage
`/tdd-domain-entity <EntityName>`

## Steps

1. **Write test file first** — create `tests/domain/entities/<EntityName>.test.ts`
   - Cover: valid construction, invalid construction (error cases), all methods, edge cases
   - Follow style of existing tests (see `tests/domain/entities/Category.test.ts`)
   - Import from `src/domain/entities/<EntityName>`

2. **Run tests — confirm red**
   ```
   rtk jest tests/domain/entities/<EntityName>.test.ts
   ```
   All tests must fail before proceeding.

3. **Implement entity** — create `src/domain/entities/<EntityName>.ts`
   - No dependencies on Application, Infrastructure, or UI layers
   - Use explicit error types (never generic `Error` for domain errors)
   - Keep it pure: no side effects, no I/O

4. **Run tests — confirm green**
   ```
   rtk jest tests/domain/entities/<EntityName>.test.ts
   ```
   All tests must pass.

5. **Refactor if needed** — run tests again after any refactor to confirm still green.

## Rules
- Never skip the red phase
- Domain layer must NOT import from any other layer
- If entity needs a repository, create the interface in `src/domain/repositories/`
