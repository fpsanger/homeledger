# Prisma Migration

Guided workflow for Prisma schema changes and migrations.

## Usage
`/prisma-migration <migration-name>`

## Steps

1. **Edit schema** — modify `src/infrastructure/database/schema.prisma`
   - Follow existing naming conventions (camelCase fields, PascalCase models)
   - Add `@map` for snake_case DB column names if needed

2. **Create migration**
   ```
   rtk prisma migrate dev --name <migration-name>
   ```
   Use kebab-case for migration name (e.g., `add-category-path`).

3. **Review generated SQL** — check file in `src/infrastructure/database/migrations/`
   - Verify no destructive changes (DROP COLUMN, DROP TABLE) without explicit intent
   - Confirm index creation for foreign keys

4. **Update repository** if schema change affects query logic
   - Repository files in `src/infrastructure/repositories/`
   - Repository must implement the domain interface exactly

5. **Run tests**
   ```
   rtk jest
   ```

## Rules
- Never edit migration SQL files manually
- Never run `prisma migrate reset` on production data
- Every schema change needs a migration — no direct DB edits
