# Installments Page Design

**Date:** 2026-05-06  
**Status:** Approved

## Goal

Add `/installments` page where users can view all credit card purchases with their installments, filter by person, toggle canceled installments visibility, and mark individual installments as paid.

## Architecture

Server-rendered page (Next.js App Router, consistent with existing pages).

- Person filter via URL search param `?personId=<id>` — bookmarkable, shareable
- Mark-paid via Server Action → `PATCH /api/installments/[id]/paid` → `revalidatePath('/installments')`
- Show/hide canceled toggle via client-side `useState` (no server round-trip)

## Data Flow

1. `page.tsx` fetches people (for dropdown) and credit card purchases (filtered by `personId` if present, includes nested installments) server-side
2. Passes data to `InstallmentsList` client component
3. Client handles filter navigation, canceled toggle, and mark-paid interactions

## New API Endpoint

`GET /api/credit-card-purchases?personId=<id>`

- `personId` optional — omit to return all purchases
- Returns purchases with nested installments
- Backed by new `GetCreditCardPurchasesUseCase` in application layer

## Components

```
src/app/installments/
  page.tsx                        — server component, fetches people + purchases

src/components/installments/
  InstallmentsList.tsx            — client component: filter, toggle, mark-paid

src/app/api/credit-card-purchases/
  route.ts                        — GET handler

src/application/use-cases/
  GetCreditCardPurchasesUseCase.ts
```

## UI Structure

- Person filter dropdown: options = all people + "All"
- "Show canceled" toggle (checkbox or switch)
- Purchase cards (always expanded):
  - Header: description, total amount, person, purchase date
  - Installment rows: #, due month/year, amount, status badge (Paid / Canceled / Pending)
  - "Mark Paid" button on unpaid + non-canceled installments only

## Error Handling

- Mark-paid failure → inline error message (alert or toast)
- Data fetch failure → empty state with error message on page

## Testing

- `GetCreditCardPurchasesUseCase` — unit test (follows TDD pattern)
- `markInstallmentPaid` use case — already tested
- UI — manual testing
- No new domain logic → no new domain tests needed

## Out of Scope

- Undo mark-paid
- Pagination
- Sorting
