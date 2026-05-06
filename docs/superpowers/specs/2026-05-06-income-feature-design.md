# Income Feature Design

**Date:** 2026-05-06

## Overview

Add income tracking to HomeLedger. Rename the Expenses page to Transactions. Use a tab switcher inside the existing left card to toggle between Expense and Income forms.

---

## Domain Layer

### `Transaction.ts`
Add `createIncome()` function alongside existing `createExpense()`. Validates:
- `personId` required
- `date` required
- `amount > 0`
- `source` required (must be valid `IncomeSource`)

### `IncomeSource` enum
Add to domain (e.g. in `Transaction.ts` or a shared `enums.ts`):
```ts
type IncomeSource = "SALARY" | "FREELANCE" | "RENTAL" | "INVESTMENT" | "OTHER";
```

---

## Application Layer

### `CreateIncomeUseCase.ts`
Mirrors `CreateExpenseUseCase`. Accepts income input, calls `createIncome()`, persists via `ITransactionRepository`.

---

## Infrastructure / Database

### Migration
Add nullable `source` column to `Transaction` table:
- Type: `IncomeSource` enum (Prisma enum)
- Nullable — expenses have `null`, incomes have a value

No other schema changes needed. `type: INCOME | EXPENSE` already exists.

---

## API

### `POST /api/incomes`
New dedicated route (not reusing `/api/expenses`) for clarity.
Request body:
```json
{
  "personId": "string",
  "amount": 100.00,
  "date": "2026-05-06",
  "source": "SALARY",
  "categoryId": "string | null",
  "description": "string"
}
```

---

## UI

### Page rename
`src/app/expenses/` → `src/app/transactions/`
Nav label: "Expenses" → "Transactions"

### Component changes
- `src/components/expenses/` → `src/components/transactions/`
- New: `src/components/transactions/TransactionTabs.tsx` — tab switcher ("Expense" | "Income")
- New: `src/components/transactions/IncomeForm.tsx` — fields: person, amount, date, source (select), category, description
- Existing `ExpenseForm.tsx` moved to `src/components/transactions/`
- Existing `InstallmentForm.tsx` moved to `src/components/transactions/`

### Page layout
Left card: `TransactionTabs` (Expense tab → `ExpenseForm`, Income tab → `IncomeForm`)
Right card: "Add Credit Card Purchase" → `InstallmentForm` (unchanged)

---

## Testing

### Domain (TDD — mandatory)
`tests/domain/entities/Transaction.test.ts`:
- `createIncome()` with valid input
- `createIncome()` missing person → error
- `createIncome()` amount ≤ 0 → error
- `createIncome()` missing source → error

`tests/application/use-cases/CreateIncomeUseCase.test.ts`:
- Happy path: income persisted
- Repository error propagated

---

## Out of Scope
- Income listing/table view (future)
- Editing or deleting incomes (future)
- Monthly view income integration (future)
