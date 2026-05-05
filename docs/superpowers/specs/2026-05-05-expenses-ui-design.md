# Expenses UI — Design Spec

**Date:** 2026-05-05

## Context

People and Categories UI are in place. Expenses UI is the primary data-entry mechanism for the system. The full domain, application, and API layers already exist. This spec covers UI only.

Scope: regular expense entry + credit card installment purchases. Income and a transaction list are explicitly out of scope (Monthly View handles the list).

## Files to Create

```
src/app/expenses/page.tsx
src/components/expenses/ExpenseForm.tsx
src/components/expenses/InstallmentForm.tsx
```

## Architecture

**`src/app/expenses/page.tsx`** — server component

- Fetches `GET /api/people` and `GET /api/categories` in parallel
- Computes leaf categories server-side: categories where no other category has them as `parentId`
- Layout: `grid grid-cols-1 md:grid-cols-2 gap-6` — two cards side by side on wide screens, stacked on mobile
- Passes `people` and `leafCategories` as props to both forms

**`src/components/expenses/ExpenseForm.tsx`** — client component

Fields:

| Field | Input | Required | Notes |
|---|---|---|---|
| Person | select | yes | list by name |
| Amount | number | yes | positive |
| Date | date | yes | default today |
| Payment method | select | yes | see values below |
| Category | select | no | leaf categories only; first option = "None" |
| Description | text | no | |

Payment method values: `CASH` → "Cash", `DEBIT_CARD` → "Debit Card", `CREDIT_CARD` → "Credit Card", `PIX` → "PIX", `BANK_TRANSFER` → "Bank Transfer", `BOLETO` → "Boleto"

On submit: `POST /api/expenses { personId, amount, date, paymentMethod, categoryId?, description? }`
On success: clear form.
On error: inline error message below submit button.

**`src/components/expenses/InstallmentForm.tsx`** — client component

Fields:

| Field | Input | Required | Notes |
|---|---|---|---|
| Person | select | yes | list by name |
| Total amount | number | yes | positive |
| Installments | number | yes | min 1 |
| Purchase date | date | yes | default today |
| Category | select | no | leaf categories only; first option = "None" |
| Description | text | no | |

No payment method field — installments are always credit card by domain rule.

On submit: `POST /api/installments { personId, totalAmount, numberOfInstallments, purchaseDate, categoryId?, description? }`
On success: clear form.
On error: inline error message below submit button.

## Reuse

- `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@/components/ui/card`
- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`
- `Select` from `@/components/ui/select`
- Pattern mirrors `src/components/people/PersonForm.tsx`

## Verification

Manual test by user.
