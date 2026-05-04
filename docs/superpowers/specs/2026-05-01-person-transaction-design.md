# Person & Transaction — Design Spec

**Date:** 2026-05-01
**Status:** Approved

---

## Overview

Person and Transaction are the two foundational domain entities. A `Person` represents a household member. A `Transaction` (specifically an Expense) is a financial event that belongs to a person. The `MonthlyView` service aggregates transactions and installments into the data needed to render a month's financial picture.

There is no login, no workspace, no multi-tenancy. The household is a single implicit context.

---

## Requirements

- Create a person with a name
- List all people
- Create an expense belonging to a person
- Expense must have: `personId`, `amount > 0`, `date`, `paymentMethod`
- Expense may have an optional `categoryId`
- Six payment methods supported: CASH, DEBIT_CARD, CREDIT_CARD, PIX, BANK_TRANSFER, BOLETO
- Monthly view aggregates expenses and installments for a given `(year, month)`
- Monthly view optionally filtered by `personId`

---

## Domain Model

### `PersonRecord`

```ts
interface PersonRecord {
  id: string
  name: string
  createdAt: Date
}
```

**Validation rules:**
- `name` is required and cannot be blank or whitespace-only
- `name` is trimmed before storage
- No `workspaceId` — single-household system

### `TransactionRecord`

```ts
interface TransactionRecord {
  id: string
  personId: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: Date
  description: string
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO"
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
}
```

**Validation rules:**
- `personId` is required
- `amount` must be `> 0`
- `date` is required
- `categoryId` is optional (`null` allowed)
- `type` is always `"EXPENSE"` when created via `createExpense`
- No `creditCardPurchaseId` or installment fields — one-time expenses are standalone

---

## Domain Functions — `src/domain/entities/`

### `Person.ts`

```ts
createPerson(input: { id: string; name: string }): PersonRecord
// Trims name. Throws "Name is required" if blank.
```

### `Transaction.ts`

```ts
createExpense(input: CreateExpenseInput): TransactionRecord
// Throws "Person is required" if personId missing.
// Throws "Amount must be positive" if amount <= 0.
// Throws "Date is required" if date missing.
// Sets type = "EXPENSE".
```

---

## Repository Interfaces — `src/domain/repositories/`

### `IPersonRepository`

```ts
interface IPersonRepository {
  findAll(): Promise<PersonRecord[]>
  findById(id: string): Promise<PersonRecord | null>
  save(person: Omit<PersonRecord, "createdAt">): Promise<PersonRecord>
  delete(id: string): Promise<void>
}
```

### `ITransactionRepository`

```ts
interface ITransactionRepository {
  findById(id: string): Promise<TransactionRecord | null>
  findByMonth(year: number, month: number): Promise<TransactionRecord[]>
  findByPersonAndMonth(personId: string, year: number, month: number): Promise<TransactionRecord[]>
  save(transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord>
  delete(id: string): Promise<void>
}
```

---

## Monthly View Service — `src/domain/services/MonthlyView.ts`

```ts
type MonthlyViewInput = {
  transactions: TransactionRecord[]
  installments: InstallmentRecord[]
  year: number
  month: number
  personId?: string
}

type MonthlyViewResult = {
  transactions: TransactionRecord[]
  installments: InstallmentRecord[]
}

buildMonthlyView(input: MonthlyViewInput): MonthlyViewResult
```

**Rules:**
- Filters `transactions` to those whose `date` falls in `(year, month)` using UTC
- Filters installments to those with `dueYear === year && dueMonth === month && !isCanceled`
- When `personId` is provided, filters `transactions` to that person only
- Pure function, no side effects

---

## Use Cases — `src/application/use-cases/`

### `CreatePersonUseCase`

1. Call `createPerson(input)` — validates and builds record
2. Call `repo.save(person)`
3. Return saved record

### `ListPeopleUseCase`

1. Call `repo.findAll()`
2. Return list

### `CreateExpenseUseCase`

1. Call `createExpense(input)` — validates and builds record
2. Call `repo.save(expense)`
3. Return saved record

### `GetMonthlyViewUseCase`

Dependencies: `ITransactionRepository`, `ICreditCardPurchaseRepository`

1. Fetch transactions for `(year, month)` — scoped by `personId` if provided
2. Fetch installments for `(year, month)` — scoped by `personId` if provided
3. Call `buildMonthlyView({ transactions, installments, year, month, personId })`
4. Return result

---

## Testing Strategy

### Domain entities (TDD — required)

`tests/domain/entities/Person.test.ts`:
- Valid name → record created, name trimmed
- Empty or whitespace name → throws
- No `workspaceId` on result

`tests/domain/entities/Transaction.test.ts`:
- Valid input → expense created with `type: "EXPENSE"`
- Missing `personId` → throws
- `amount <= 0` → throws
- Missing `date` → throws
- All 6 payment methods accepted
- `categoryId` null allowed
- No installment-related fields on result

### Repository contracts (in-memory implementations)

`tests/domain/repositories/IPersonRepository.test.ts`
`tests/domain/repositories/ITransactionRepository.test.ts`:
- Save and retrieve by id
- `findByPersonAndMonth` returns only matching person + month
- Delete removes record
- No `workspaceId` on persisted records

### Monthly view service

`tests/domain/services/MonthlyView.test.ts`:
- Filters transactions to correct month
- Excludes canceled installments
- `personId` filter applies to transactions

---

## Out of Scope

- Income entity (type exists in `TransactionRecord` but `createIncome` not implemented)
- Infrastructure repositories (Prisma implementations)
- UI layer
- Category validation (Category module)
- Credit card installments (Installment Purchases module)
