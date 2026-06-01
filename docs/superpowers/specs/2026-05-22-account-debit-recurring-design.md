# Design: Account Debit Payment Method + Recurring Transaction Month Count

**Date:** 2026-05-22  
**Status:** Approved

---

## Summary

Add "Débito em conta" (`ACCOUNT_DEBIT`) as a payment method across the system. Allow recurring transactions to optionally specify a number of months instead of an explicit end date. No new domain entities, tables, or repositories required.

---

## Use Cases

- User registers a car insurance bill paid monthly via account debit for 12 months.
- User registers an indefinite recurring tax (IPVA) via account debit with no end date.
- User registers a one-time expense paid via account debit.

These are distinct from credit card installments (which are tied to a credit card, closure day, and purchase total) and from standard expenses.

---

## Domain Changes

### 1. `src/domain/repositories/ITransactionRepository.ts`

Add `"ACCOUNT_DEBIT"` to the `paymentMethod` union in `TransactionRecord`:

```ts
paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO" | "ACCOUNT_DEBIT" | null;
```

### 2. `src/domain/repositories/IRecurringTransactionRepository.ts`

Add `"ACCOUNT_DEBIT"` to the `paymentMethod` union in `RecurringTransactionRecord`:

```ts
paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO" | "ACCOUNT_DEBIT";
```

### 3. `src/domain/services/RecurringTransaction.ts`

Update any validation that checks against a hardcoded payment method list to accept `ACCOUNT_DEBIT`.

---

## API Changes

### 4. `src/app/api/expenses/route.ts`

Add `"ACCOUNT_DEBIT"` to `VALID_PAYMENT_METHODS`.

### 5. `src/app/api/recurring-transactions/route.ts`

Add `"ACCOUNT_DEBIT"` to `VALID_PAYMENT_METHODS`.

---

## Database / Migration

### 6. Prisma schema

Add `ACCOUNT_DEBIT` to the `PaymentMethod` enum in `schema.prisma`.

### 7. Migration

Generate and apply a new migration to update the enum in PostgreSQL.

---

## UI Changes

### 8. Payment method dropdowns

All dropdowns that list payment methods must include "Débito em conta" mapped to `ACCOUNT_DEBIT`. Affected locations: expense form, income form (if applicable), recurring transaction form, edit forms.

### 9. Recurring transaction form — number of months field

Add an optional "number of months" input field. Behavior:

- If filled: `endDate = startDate + numberOfMonths months` (computed on submit, before API call)
- If blank: `endDate = null` (indefinite)

The field is a UX convenience only — the API and domain remain unchanged. `endDate` continues to be the source of truth.

---

## Out of Scope

- Per-month payment tracking (isPaid per occurrence) — not needed; recurring transactions remain virtual.
- New domain entities or repositories.
- Changes to credit card installment logic.
- Changes to `MonthlyView` service — `RecurringTransaction` occurrences already appear there.

---

## Testing

- Domain: update/add unit tests in `tests/domain/services/RecurringTransaction.test.ts` to cover `ACCOUNT_DEBIT` as valid payment method.
- API: update validation tests for expenses and recurring-transactions routes.
- No new integration tests required beyond existing patterns.
