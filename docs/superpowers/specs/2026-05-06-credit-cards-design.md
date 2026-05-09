# Credit Cards Design

**Date:** 2026-05-06

## Overview

Introduce a `CreditCard` entity that credit card purchases must be linked to. Each card defines its billing cycle (closure date) and due date. Installment due months are calculated from the card's closure date and purchase date. Two new views: credit card bill view (grouped by card) and all-purchases monthly view.

---

## Data Model

### `CreditCard`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | e.g. "Nubank", "Itaú" |
| `closureType` | enum FIXED \| VARIABLE | |
| `fixedClosureDay` | int (1–31) \| null | Required when FIXED, null when VARIABLE |
| `dueDayOfMonth` | int (1–31) | Fixed day the bill is paid each month |
| `alwaysNextMonth` | boolean | When true, first installment always goes to next month regardless of closure date |
| `createdAt` | datetime | |

**Invariants:**
- `fixedClosureDay` must be set if and only if `closureType = FIXED`
- `dueDayOfMonth` always required

### `CreditCardClosure`

Used only by VARIABLE cards. Must exist for a given month before any purchase can be registered.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `creditCardId` | uuid | FK → CreditCard |
| `year` | int | |
| `month` | int | 1–12 |
| `closureDay` | int | 1–31 |

**Unique constraint:** `(creditCardId, year, month)`

### `CreditCardPurchase` (modified)

Add `creditCardId` (uuid, required FK → `CreditCard`).

---

## Installment Due Month Calculation

```
function resolveClosureDay(card, purchaseDate):
  if card.closureType == FIXED:
    return card.fixedClosureDay
  else:
    closure = lookup CreditCardClosure(card.id, purchaseDate.year, purchaseDate.month)
    if not found: throw error (closure required before purchase)
    return closure.closureDay

function firstDueMonth(card, purchaseDate):
  closureDay = resolveClosureDay(card, purchaseDate)
  if card.alwaysNextMonth OR purchaseDate.day >= closureDay:
    return purchaseMonth + 1
  else:
    return purchaseMonth

-- Subsequent installments follow sequentially from firstDueMonth
```

**Rule:** Purchase made **before** closure day → current billing cycle. Purchase made **on or after** closure day → next billing cycle.

---

## Architecture

### Domain (`src/domain/`)

- `CreditCard` entity — validates FIXED/VARIABLE invariants
- `CreditCardClosure` entity — validates day 1–31
- `ICreditCardRepository` interface:
  - CRUD for cards
  - `findClosure(cardId, year, month): CreditCardClosure | null`
  - `setClosure(cardId, year, month, day): void`
- `InstallmentPurchase` service — updated to accept card + optional closure, compute first due month with new logic

### Application (`src/application/use-cases/`)

- `CreateCreditCardUseCase`
- `UpdateCreditCardUseCase`
- `DeleteCreditCardUseCase` — blocked if purchases exist
- `ListCreditCardsUseCase`
- `SetCreditCardClosureUseCase` — creates/updates closure for a month (VARIABLE cards only)
- `CreateInstallmentPurchaseUseCase` — updated: requires `creditCardId`, fetches card, resolves closure, delegates to domain service
- `GetCreditCardBillUseCase` — given year+month, returns installments grouped by card with closure/due date info

### Infrastructure

- `PrismaCreditCardRepository` — implements `ICreditCardRepository`
- Migration: add `CreditCard` table, `CreditCardClosure` table, add `creditCardId` to `CreditCardPurchase`

### UI

**`/credit-cards` page**
- List all cards (name, closure type, due day, alwaysNextMonth flag)
- Create/edit form: name, closureType, fixedClosureDay (conditional), dueDayOfMonth, alwaysNextMonth toggle
- Delete (blocked if purchases exist)
- VARIABLE cards: sub-section to manage monthly closure dates (list by month, add/edit)

**Credit card purchase form (existing `InstallmentForm`)**
- Add credit card selector (required)
- Preview calculated first due month

**Bill view** (new tab on `/installments` or dedicated `/credit-cards/bills`)
- Month navigator
- Grouped by card: card name, closure day, due date, installments in that cycle, subtotal
- Second tab: flat list of all purchases affecting that month

---

## Error Cases

- VARIABLE card purchase with no closure set for that month → reject with explicit error
- Delete card with existing purchases → reject
- `fixedClosureDay` set on VARIABLE card → domain entity throws
- `numberOfInstallments <= 1` → still handled by existing rule (use expense instead)

---

## Testing

- Domain unit tests (TDD):
  - `CreditCard` entity invariants
  - `firstDueMonth` calculation: before/on/after closure, alwaysNextMonth flag
  - Variable card with missing closure → error
- Application integration tests:
  - `CreateInstallmentPurchaseUseCase` with card linked
  - `GetCreditCardBillUseCase` grouping
- UI: minimal logic, tested manually
