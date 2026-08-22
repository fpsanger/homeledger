# Repository Guidelines

## Project Structure & Module Organization

Homeledger is a Next.js 14 App Router application organized with Clean Architecture. Keep business entities, services, errors, and repository contracts in `src/domain/`; this layer must not import application, infrastructure, or UI code. Put orchestration in `src/application/`, Prisma implementations and statement parsers in `src/infrastructure/`, routes and pages in `src/app/`, and reusable UI in `src/components/`. Tests mirror source areas under `tests/` (for example, `src/domain/entities/Category.ts` maps to `tests/domain/entities/Category.test.ts`). Static PWA assets live in `public/`; database schema and migrations live in `src/infrastructure/database/`.

Before investigating code, consult `graphify-out/GRAPH_REPORT.md`; read `SPEC.md` for product rules and `PRODUCT.md` plus `DESIGN.md` before UI changes.

## Build, Test, and Development Commands

- `npm install` installs the Node.js 22 dependencies.
- `docker compose up -d` starts PostgreSQL on the configured local port.
- `npx prisma migrate dev` applies migrations to the development database.
- `npm run dev` serves the app at `http://localhost:3000`.
- `npm run build` creates and type-checks the production build.
- `npm test` runs the complete Jest suite; append a test path to focus a file.
- `npm run lint` runs Biome checks; `npm run format` applies formatting.

## Coding Style & Naming Conventions

TypeScript is strict. Biome enforces two-space indentation, 100-character lines, double quotes, semicolons, and organized imports. Use `PascalCase` for components, entities, and classes; `camelCase` for functions and variables; and descriptive use-case names such as `CreateExpenseUseCase.ts`. Keep business rules out of React components and API handlers. Make all schema changes through versioned Prisma migrations.

## Testing Guidelines

Jest, ts-jest, and Testing Library are configured in `package.json`. Name tests `*.test.ts` or `*.test.tsx`. Domain changes require TDD: add a failing test, implement the minimum behavior, then refactor. Add component tests for meaningful interactions and regression tests for fixes. No numeric coverage threshold is defined, but changed behavior should be exercised.

## Commit & Pull Request Guidelines

Prefer Conventional Commit subjects (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`), written as short imperatives; recent history is mixed, so improve consistency. Name branches `<type>/<scope>-<description>` in lowercase kebab-case, such as `fix/loyalty-mobile-layout`. Open PRs against `develop`, describe behavior and verification, link relevant issues, and include before/after screenshots for UI changes. Update `CHANGELOG.md` for user-visible, domain, schema, or operational changes, and ensure tests, Prisma validation, lint, and the production build pass.

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
