# Person & Transaction Entities — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the core domain entities `Person` and `Transaction` (Expense), their repository interfaces, and the application use cases that orchestrate them. This layer is the foundation for all financial records in the system.

**Architecture:** Domain layer (`src/domain/`) holds records, validation, and repository interfaces. Application layer (`src/application/`) holds use cases. No infrastructure code here — repositories are injected as interfaces.

**Context:** The household has a fixed set of people. Every financial record belongs to a person. Transactions cover incomes and expenses. This module also establishes the `MonthlyView` service used by all future features.

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

No `workspaceId` or multi-tenant fields — this is a single-household system.

---

## Implementation Steps

### Step 1 — Repository interfaces

- [ ] Create `src/domain/repositories/IPersonRepository.ts`
  - `PersonRecord` type
  - `IPersonRepository` interface: `findAll`, `findById`, `save`, `delete`
- [ ] Create `src/domain/repositories/ITransactionRepository.ts`
  - `TransactionRecord` type with all payment methods
  - `ITransactionRepository` interface: `findById`, `findByMonth`, `findByPersonAndMonth`, `save`, `delete`
- [ ] Write contract tests `tests/domain/repositories/IPersonRepository.test.ts` using in-memory implementation
- [ ] Write contract tests `tests/domain/repositories/ITransactionRepository.test.ts` using in-memory implementation

### Step 2 — Person entity

- [ ] Write failing test `tests/domain/entities/Person.test.ts`
  - valid name → creates record
  - trims whitespace
  - empty name → throws "Name is required"
  - whitespace-only name → throws "Name is required"
  - no `workspaceId` field
- [ ] Implement `src/domain/entities/Person.ts` — `createPerson(input): PersonRecord`
- [ ] All tests pass

### Step 3 — Transaction entity (Expense)

- [ ] Write failing test `tests/domain/entities/Transaction.test.ts`
  - valid input → creates expense with `type: "EXPENSE"`
  - missing `personId` → throws "Person is required"
  - `amount <= 0` → throws "Amount must be positive"
  - missing `date` → throws "Date is required"
  - `categoryId` optional (null allowed)
  - all 6 payment methods accepted
  - no `workspaceId` or installment-related fields
- [ ] Implement `src/domain/entities/Transaction.ts` — `createExpense(input): TransactionRecord`
- [ ] All tests pass

### Step 4 — Monthly view service

- [ ] Write failing test `tests/domain/services/MonthlyView.test.ts`
  - filters transactions to requested month
  - filters installments to requested month, excludes canceled
  - `personId` filter applies when provided
- [ ] Implement `src/domain/services/MonthlyView.ts` — `buildMonthlyView(input): MonthlyViewResult`
- [ ] All tests pass

### Step 5 — Application use cases

- [ ] Implement `src/application/use-cases/CreatePersonUseCase.ts`
  - calls `createPerson`, saves via repo
- [ ] Implement `src/application/use-cases/ListPeopleUseCase.ts`
  - calls `repo.findAll()`
- [ ] Implement `src/application/use-cases/CreateExpenseUseCase.ts`
  - calls `createExpense`, saves via repo
- [ ] Implement `src/application/use-cases/GetMonthlyViewUseCase.ts`
  - fetches transactions and installments, calls `buildMonthlyView`
  - accepts optional `personId` for per-person filtering

### Step 6 — Validate

- [ ] Run `rtk jest` — all tests pass
- [ ] No domain imports of infrastructure types

---

## File Map

```
src/
  domain/
    entities/
      Person.ts
      Transaction.ts
    repositories/
      IPersonRepository.ts
      ITransactionRepository.ts
    services/
      MonthlyView.ts
  application/
    use-cases/
      CreatePersonUseCase.ts
      ListPeopleUseCase.ts
      CreateExpenseUseCase.ts
      GetMonthlyViewUseCase.ts

tests/
  domain/
    entities/
      Person.test.ts
      Transaction.test.ts
    repositories/
      IPersonRepository.test.ts
      ITransactionRepository.test.ts
    services/
      MonthlyView.test.ts
```

---

## Out of Scope

- Income entity (only Expense implemented in this module)
- Infrastructure repositories (Prisma implementations)
- UI layer (API routes, components)
- Category validation (handled in Category module)
- Credit card installments (handled in Installment Purchases module)
