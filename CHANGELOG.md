# Changelog

## [Unreleased]

### Added
- Domain behavior tests for `Person` entity: name validation, no workspaceId (`tests/domain/entities/Person.test.ts`)
- Domain behavior tests for `Transaction` (Expense) entity: personId required, amount positive, date required, categoryId optional, no workspaceId (`tests/domain/entities/Transaction.test.ts`)
- Monthly view service tests: groups by month, filters by person, includes installments, no duplicates, no workspaceId (`tests/domain/services/MonthlyView.test.ts`)
- Installment purchase service tests: N installments created, amount split, month rollover, personId on all installments, categoryId optional, validation rules, no workspaceId (`tests/domain/services/InstallmentPurchase.test.ts`)
- Updated `IPersonRepository` contract test with in-memory implementation covering save, list, findById, delete, and no-workspaceId assertion
- Updated `ITransactionRepository` contract test with in-memory implementation covering expense save, findByPersonAndMonth filtering, delete, and no-workspaceId assertion

### Added
- Next.js 14 project initialized with TypeScript, Tailwind CSS, App Router (`src/` layout)
- Prisma 7 ORM with PostgreSQL — schema at `src/infrastructure/database/schema.prisma`
- Database models: `User`, `Workspace`, `WorkspaceMember`, `Category`, `Transaction`, `CreditCardPurchase`, `Installment`, `RecurringTransaction`
- Enums: `Role`, `TransactionType`, `PaymentMethod`
- Initial database migration applied (`20260502200910_init`)
- `PrismaClient` singleton at `src/infrastructure/database/client.ts`
- Domain repository interfaces (zero Prisma imports): `IUserRepository`, `IWorkspaceRepository`, `ITransactionRepository`, `ICreditCardPurchaseRepository`, `IRecurringTransactionRepository`, `ICategoryRepository`
- Compile-time contract tests for all 6 repository interfaces
- `docker-compose.yml` with PostgreSQL 16 on port 5433 for local development
