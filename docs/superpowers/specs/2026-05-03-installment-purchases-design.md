# Installment Purchases — Design Spec

**Date:** 2026-05-03
**Status:** Approved

---

## Overview

An installment purchase is a credit card purchase split into N monthly payments. The original purchase stores the full amount and count. Each installment carries its own amount, due month, and status. Installments appear in the monthly view for their specific `(dueYear, dueMonth)` — not the purchase date.

One-time credit card charges use `createExpense` (from the Transaction module). `createInstallmentPurchase` only handles purchases with more than one installment.

---

## Requirements

- Create a credit card purchase split into N installments (N > 1)
- Each installment knows its due month and amount
- First installment is due in the same month as the purchase date
- Subsequent installments advance one month each
- Installment amounts are floored to 2 decimal places; rounding difference absorbed by the last installment so the total is preserved
- Month rollover handled correctly (e.g. November + 3 months → Jan of next year)
- Canceling a purchase marks all installments as `isCanceled: true`
- Canceled installments are excluded from the monthly view
- Paid status tracked per installment (`isPaid`)
- All installments created as `isPaid: false`, `isCanceled: false`
- `categoryId` is optional; when provided, propagated to all installments

---

## Domain Model

### `CreditCardPurchaseRecord`

```ts
interface CreditCardPurchaseRecord {
  id: string
  personId: string
  description: string
  totalAmount: number
  numberOfInstallments: number
  purchaseDate: Date
  categoryId: string | null
  createdAt: Date
}
```

### `InstallmentRecord`

```ts
interface InstallmentRecord {
  id: string
  creditCardPurchaseId: string
  installmentNumber: number
  amount: number
  dueYear: number
  dueMonth: number
  isPaid: boolean
  isCanceled: boolean
}
```

Note: `InstallmentRecord` has no `personId` directly — person is resolved through the parent `CreditCardPurchaseRecord`. The `InstallmentDraft` (used during creation) carries `personId` for convenience, but the persisted record does not.

---

## Domain Service — `src/domain/services/InstallmentPurchase.ts`

Pure functions, no side effects.

### Types

```ts
type InstallmentDraft = {
  personId: string
  installmentNumber: number
  amount: number
  dueYear: number
  dueMonth: number
  isPaid: boolean
  isCanceled: boolean
  categoryId: string | null
}

type InstallmentDraftWithPurchaseId = InstallmentDraft & {
  creditCardPurchaseId: string
}

type PurchaseDraft = {
  id: string
  personId: string
  totalAmount: number
  numberOfInstallments: number
  purchaseDate: Date
  description: string
  categoryId: string | null
}
```

### Functions

```ts
createInstallments(input: CreateInstallmentsInput): InstallmentDraft[]
// Validates: personId required, totalAmount > 0, numberOfInstallments >= 1
// Computes baseAmount = floor(totalAmount / n * 100) / 100
// Throws "Amount too small for the number of installments" if baseAmount <= 0
// Last installment absorbs rounding: amount = totalAmount - baseAmount * (n - 1)
// Due months start at purchaseDate month, advance by 1 per installment (UTC)
// All start as isPaid: false, isCanceled: false

createInstallmentPurchase(input: CreateInstallmentPurchaseInput): { purchase: PurchaseDraft; installments: InstallmentDraftWithPurchaseId[] }
// Validates: personId required, totalAmount > 0, numberOfInstallments > 1 (strictly)
// One-installment purchases must use createExpense instead
// Calls createInstallments internally
// Attaches creditCardPurchaseId to each installment draft

cancelInstallmentPurchase(installments: InstallmentRecord[]): (InstallmentRecord & { isCanceled: true })[]
// Returns new array with all installments marked isCanceled: true
// Preserves all other fields (amount, isPaid, dueMonth, etc.)
// Pure — does not mutate input
// Empty list → returns empty list
```

---

## Repository Interface — `src/domain/repositories/ICreditCardPurchaseRepository.ts`

```ts
interface ICreditCardPurchaseRepository {
  save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[]
  ): Promise<CreditCardPurchaseRecord>

  findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]>

  findInstallmentsByMonth(personId: string, year: number, month: number): Promise<InstallmentRecord[]>

  markInstallmentPaid(installmentId: string): Promise<void>

  findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]>

  updateInstallments(installments: InstallmentRecord[]): Promise<void>
}
```

`save` persists purchase and all installments atomically. `updateInstallments` is used by the cancel use case to batch-update all installments of a purchase.

---

## Monthly View Integration

`buildMonthlyView` (in `MonthlyView.ts`) filters installments:
- `dueYear === year && dueMonth === month && !isCanceled`

Canceled installments are excluded. Past paid installments are still visible if they fall in the requested month and are not canceled.

---

## Use Cases — `src/application/use-cases/`

### `CreateInstallmentPurchaseUseCase`

1. Call `createInstallmentPurchase(input)` — validates and builds `{ purchase, installments }`
2. Call `repo.save(purchase, installments)` — persist atomically
3. Return saved purchase record

### `CancelInstallmentPurchaseUseCase`

1. Call `repo.findByPurchaseId(purchaseId)` — get all installments
2. Call `cancelInstallmentPurchase(installments)` — returns all with `isCanceled: true`
3. Call `repo.updateInstallments(canceled)` — persist the cancellation

---

## Testing Strategy

### Domain service (TDD — required)

`tests/domain/services/InstallmentPurchase.test.ts`:

`createInstallments`:
- Correct count
- Each amount = totalAmount / n for even splits
- Sequential `installmentNumber` starting at 1
- First installment due in purchase month
- Due months advance correctly (including year rollover)
- All start as `isPaid: false`
- Missing `personId` → throws
- `totalAmount <= 0` → throws
- `numberOfInstallments < 1` → throws
- `categoryId` propagated to all installments (or null)
- Rounding: last installment absorbs difference, total preserved

`createInstallmentPurchase`:
- Returns purchase draft + linked installments
- All installments have correct `creditCardPurchaseId`
- `numberOfInstallments === 1` → throws "Number of installments must be greater than 1"
- `numberOfInstallments < 1` → throws

`cancelInstallmentPurchase`:
- All installments marked `isCanceled: true`
- Paid installments also canceled
- Original fields preserved
- Empty list → empty list

---

## Rounding Algorithm

```
baseAmount = floor(totalAmount / n * 100) / 100
lastAmount = round(totalAmount - baseAmount * (n - 1), 2)
```

Example: R$ 100 in 3 installments
- base = R$ 33.33
- installments 1–2: R$ 33.33
- installment 3: R$ 33.34
- total: R$ 100.00

---

## Out of Scope

- Paying individual installments (use case not implemented beyond `markInstallmentPaid` on the repo interface)
- Editing purchase details after creation
- Single-installment credit card purchases (use `createExpense` instead)
- Infrastructure Prisma implementation
- UI layer
