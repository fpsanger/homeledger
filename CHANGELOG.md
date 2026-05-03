# Changelog

## [Unreleased]

### Added
- `src/domain/services/InstallmentPurchase.ts` — `createInstallmentPurchase()`: validates personId required, totalAmount > 0, numberOfInstallments > 1, baseAmount > 0 (rejects amount-too-small cases); returns `{ purchase: PurchaseDraft, installments: InstallmentDraftWithPurchaseId[] }` with `creditCardPurchaseId` on each installment
- `src/domain/services/InstallmentPurchase.ts` — `cancelInstallmentPurchase()`: pure function, marks all installments `isCanceled: true`, preserves all other fields, handles empty array
- `src/domain/services/InstallmentPurchase.ts` — `createInstallments()`: fixed rounding — uses `Math.floor` for base installments so last installment always ≥ base; last installment absorbs cent difference; validates `baseAmount > 0`
- `src/domain/services/MonthlyView.ts` — `buildMonthlyView()`: excludes `isCanceled: true` installments from monthly view
- `src/domain/repositories/ICreditCardPurchaseRepository.ts` — `InstallmentRecord.isCanceled: boolean` added; `cancelPurchase(purchaseId)` added to interface
- `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts` — orchestrates domain validation + repo save for installment purchases
- `src/application/use-cases/CancelInstallmentPurchaseUseCase.ts` — delegates purchase cancellation to repository

- Domain tests for installment purchases (RED — production code not yet implemented):
  - `createInstallmentPurchase`: returns purchase draft + installments with `creditCardPurchaseId`; requires `numberOfInstallments > 1`; validates personId and totalAmount; rounding difference absorbed by last installment; sequential installment_number; correct due_month per installment; all installments linked to same person
  - `cancelInstallmentPurchase`: marks all installments as `isCanceled: true` regardless of paid status; preserves all original fields; handles empty list
  - `createInstallments` (rounding): last installment absorbs cent difference so sum equals totalAmount exactly
  - `buildMonthlyView` (canceled): canceled installments excluded from monthly view
  - `buildMonthlyView` (totals): installment amount per month is not the full purchase total; purchase total not duplicated across months
  - `createExpense` (boundary): one-time expense has no `creditCardPurchaseId`, `installments`, or `numberOfInstallments` fields

### Added
- `src/domain/entities/Category.ts` — `createCategory()`: validates name (required, trimmed), validates householdId required, computes `path` (root = name, subcategory = parent/name) and `level` (root = 0, child = parent+1); no workspace coupling
- `src/domain/services/CategoryTree.ts` — `isCircularReference()`: ancestor-chain walk; `canDeleteCategory()` / `isLeafCategory()`: checks for children; `validateExpenseCategory()`: null allowed, leaf-only rule enforced; `computeUpdatedPaths()`: cascades path+level to all descendants; `buildCategoryTree()`: nested tree from flat list
- `src/domain/repositories/ICategoryRepository.ts` — extended `CategoryRecord` with `householdId`, `path`, `level`; field order: domain fields before infrastructure field before timestamp
- `src/infrastructure/repositories/PrismaCategoryRepository.ts` — implements `ICategoryRepository`; upsert-based `save()` supports path cascade updates; maps `householdId = "default"` constant (single-household product, not stored in DB)
- Migration `20260503140811_add_category_path_level` — adds `path String` and `level Int` columns to `category` table with safe defaults

### Added
- Domain tests for `Category` entity (`tests/domain/entities/Category.test.ts`): root creation, subcategory with parentId, householdId required, name required/trimmed, path generation (root = name, sub = parent/name, deep), level calculation (root=0, child=parent+1, no workspaceId)
- Domain tests for `CategoryTree` service (`tests/domain/services/CategoryTree.test.ts`): circular reference detection (self-parent, ancestor loop, chain loop), canDeleteCategory (blocks when children exist), computeUpdatedPaths (cascade path+level on reparent, promote to root), buildCategoryTree (root nodes, nested children, multi-level, leaf empty children)
- Category-Expense integration tests: isLeafCategory, validateExpenseCategory (null = allowed, leaf = allowed, missing = throws, non-leaf = throws)

### Added
- `src/domain/entities/Person.ts` — `createPerson()`: validates name (required, trimmed), returns `PersonRecord`, no workspaceId
- `src/domain/entities/Transaction.ts` — `createExpense()`: validates personId required, amount positive, date required; categoryId optional; always sets type=EXPENSE
- `src/domain/services/MonthlyView.ts` — `buildMonthlyView()`: filters transactions and installments by year/month, optional personId filter, no duplicates
- `src/domain/services/InstallmentPurchase.ts` — `createInstallments()`: splits totalAmount into N installments, computes dueYear/dueMonth with rollover, validates personId/amount/installment count; returns `InstallmentDraft[]` with personId and categoryId
- `src/application/use-cases/CreatePersonUseCase.ts` — orchestrates domain + repo save
- `src/application/use-cases/ListPeopleUseCase.ts` — delegates to `IPersonRepository.findAll()`
- `src/application/use-cases/CreateExpenseUseCase.ts` — orchestrates domain + repo save
- `src/application/use-cases/GetMonthlyViewUseCase.ts` — fetches transactions + installments from repos, delegates filtering to domain service
- Added `findByMonth(year, month)` to `ITransactionRepository` for household-wide monthly view
- Added `findAllInstallmentsByMonth(year, month)` to `ICreditCardPurchaseRepository` for household-wide monthly view
- Removed stale `IUserRepository` contract test (User model was replaced by Person in prior refactor)

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
