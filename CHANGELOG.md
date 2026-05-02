# Changelog

## [Unreleased]

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
