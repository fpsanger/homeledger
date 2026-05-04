# Recurring Transactions — Design Spec

**Date:** 2026-05-03
**Branch:** feature/installment-purchases (to be continued or new branch)
**Status:** Approved

---

## Overview

Recurring transactions define a rule that generates monthly occurrences on-the-fly when building the monthly view. No separate occurrence records are persisted. Rules are immutable via date ranges: updating a rule closes the old one and creates a new one, preserving past month history.

---

## Requirements

- Create recurring expense or income
- Every rule requires: `personId`, `amount`, `startDate`, `frequency` (monthly initially)
- Optional: `endDate` (null = indefinite)
- Generate occurrences for a given month
- Recurring transactions appear in Monthly View
- Occurrences preserve `personId` and `categoryId`
- No duplicated occurrences
- Cancel stops future occurrences (sets `endDate = today`)
- Updating a rule affects future occurrences only (split-rule pattern)

---

## Domain Model

### `RecurringTransactionRecord`

```ts
type RecurringTransactionRecord = {
  id: string
  personId: string
  type: "INCOME" | "EXPENSE"
  amount: number
  description: string
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO"
  categoryId: string | null
  frequency: "MONTHLY"
  startDate: Date
  endDate: Date | null   // null = indefinite
  createdAt: Date
  updatedAt: Date
}
```

### Active-in-month rule

A rule is active for `(year, month)` when:
- `startDate` ≤ last day of that month, AND
- `endDate` is null OR `endDate` > first day of that month

### Cancel semantics

`endDate = today`. Current month is excluded if today is before the end of the month. Past months unaffected.

### Update semantics (split-rule)

1. Close old rule: `endDate = today`
2. Create new rule: `startDate = today`, new field values applied

Past months compute from old (now-closed) rule. Future months compute from new rule.

---

## Domain Service — `src/domain/services/RecurringTransaction.ts`

Pure functions, no side effects:

```ts
createRecurringTransaction(input: CreateRecurringInput): RecurringTransactionRecord
// Validates: personId required, amount > 0, startDate required

isActiveInMonth(rule: RecurringTransactionRecord, year: number, month: number): boolean
// Returns true if rule covers (year, month) per active-in-month rule above

generateOccurrence(rule: RecurringTransactionRecord, year: number, month: number): TransactionRecord
// Returns TransactionRecord shape from rule
// id: rule.id (recurring rules produce one occurrence per month, no collision)
// date: same day as startDate but in target (year, month)
// preserves: personId, categoryId, amount, paymentMethod, type

cancelRecurringTransaction(rule: RecurringTransactionRecord, today: Date): RecurringTransactionRecord
// Returns rule with endDate = today (pure, no side effects)

updateRecurringTransaction(
  rule: RecurringTransactionRecord,
  updates: Partial<UpdateableFields>,
  today: Date
): [RecurringTransactionRecord, RecurringTransactionRecord]
// Returns [closedRule (endDate=today), newRule (startDate=today, updates applied)]
```

`generateOccurrence` returns `TransactionRecord` so the monthly view treats recurring occurrences uniformly with regular transactions.

---

## Repository Interface — `IRecurringTransactionRepository`

Add `frequency: "MONTHLY"` to `RecurringTransactionRecord`.

Add `findById`, `findAllActiveByMonth`, and `update` methods:

```ts
findById(id: string): Promise<RecurringTransactionRecord | null>

findAllActiveByMonth(year: number, month: number): Promise<RecurringTransactionRecord[]>

update(
  id: string,
  changes: Partial<Pick<RecurringTransactionRecord,
    "endDate" | "amount" | "description" | "categoryId" | "paymentMethod" | "startDate" | "frequency"
  >>
): Promise<RecurringTransactionRecord>
```

`UpdateableFields` = `amount | description | categoryId | paymentMethod | startDate | endDate | frequency`

Existing methods retained:
- `findActiveByPersonAndMonth(personId, year, month)` — implementation must apply date range logic
- `save(record)` — create new rule
- `delete(id)` — hard delete (kept for future use)

Cancel uses `update(id, { endDate: today })`, not `delete`, to preserve history.

---

## Monthly View

### `MonthlyView.ts` changes

```ts
type MonthlyViewInput = {
  transactions: TransactionRecord[]
  installments: InstallmentRecord[]
  recurringRules: RecurringTransactionRecord[]   // new
  year: number
  month: number
  personId?: string
}

type MonthlyViewResult = {
  transactions: TransactionRecord[]   // includes recurring occurrences
  installments: InstallmentRecord[]
}
```

`buildMonthlyView` iterates `recurringRules`, filters with `isActiveInMonth`, calls `generateOccurrence`, and merges results into `transactions`.

### `GetMonthlyViewUseCase.ts` changes

Add `recurringRepo: IRecurringTransactionRepository` as third dependency. Fetch rules for the requested month and pass to `buildMonthlyView`.

---

## Use Cases

### `CreateRecurringTransactionUseCase`

1. Call `createRecurringTransaction(input)` — validates and builds record
2. Call `recurringRepo.save(record)`
3. Return saved record

### `CancelRecurringTransactionUseCase`

1. Call `recurringRepo.findById(id)` — throw if not found
2. Call `cancelRecurringTransaction(rule, today)` — returns updated rule
3. Call `recurringRepo.update(id, { endDate })`

### `UpdateRecurringTransactionUseCase`

1. Call `recurringRepo.findById(id)` — throw if not found
2. Call `updateRecurringTransaction(rule, updates, today)` → `[closedRule, newRule]`
3. Call `recurringRepo.update(closedRule.id, { endDate: closedRule.endDate })`
4. Call `recurringRepo.save(newRule)`
5. Return new rule

---

## Testing Strategy

### Domain service (TDD — required)

`tests/domain/services/RecurringTransaction.test.ts`:

- `createRecurringTransaction` — missing personId throws, amount ≤ 0 throws, valid input returns record
- `isActiveInMonth` — rule before month (startDate after month end) → false; rule after endDate → false; indefinite rule → true; rule ending mid-month → false for that month
- `generateOccurrence` — preserves personId, categoryId, amount; date is in target month
- `cancelRecurringTransaction` — endDate set to today; past occurrences unaffected
- `updateRecurringTransaction` — old rule gets endDate=today; new rule gets startDate=today + new values

### Use cases (integration tests with mocks)

`tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts`
`tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts`
`tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts`

### Monthly view (unit tests)

Extend `tests/domain/services/MonthlyView.test.ts` — active rule generates occurrence in output; inactive rule (past endDate) excluded; personId filter applies to recurring occurrences.

---

## Out of Scope

- Weekly, yearly, or custom frequencies (frequency field is extensible but only MONTHLY implemented)
- UI layer (API routes, components)
- Prisma migration and infrastructure implementation
