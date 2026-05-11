# Bulk Pay Fatura — Design Spec

**Date:** 2026-05-10  
**Branch:** fix/UI  

## Goal

Add a "Pagar fatura" button to each credit card group in the Fatura tab (BillView). Clicking it marks all unpaid, non-canceled installments for that card/month as paid in a single atomic operation.

## Approach

Single bulk endpoint (POST). Frontend already holds all installment IDs from the bill data — no extra server query needed. One round-trip, atomic DB transaction.

## Backend

### 1. `ICreditCardPurchaseRepository` (domain)

Add method:

```ts
markInstallmentsPaid(ids: string[]): Promise<void>;
```

### 2. `PrismaCreditCardPurchaseRepository` (infrastructure)

Implement with:

```ts
await prisma.installment.updateMany({
  where: { id: { in: ids }, isPaid: false },
  data: { isPaid: true },
});
```

### 3. `MarkInstallmentsPaidUseCase` (application)

```ts
// src/application/use-cases/MarkInstallmentsPaidUseCase.ts
export async function markInstallmentsPaidUseCase(
  ids: string[],
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  if (ids.length === 0) return;
  await repo.markInstallmentsPaid(ids);
}
```

### 4. API route `POST /api/installments/bulk-paid`

- Body: `{ ids: string[] }`
- Validates: array non-empty, all strings
- Returns: 204 on success
- File: `src/app/api/installments/bulk-paid/route.ts`

## Frontend (`BillView.tsx`)

### Button visibility

Show "Pagar fatura" button in each card group header when:

```ts
entry.installments.some(i => !i.isPaid && !i.isCanceled)
```

### Click handler

1. Collect IDs: `entry.installments.filter(i => !i.isPaid && !i.isCanceled).map(i => i.id)`
2. Set per-card loading state
3. Optimistically update local `bill` state: mark those installment IDs as `isPaid: true`
4. `POST /api/installments/bulk-paid` with `{ ids }`
5. On error: revert optimistic update, show inline error message
6. On success: clear loading state

### State additions

```ts
const [paying, setPaying] = useState<Set<string>>(new Set()); // cardId → in-flight
const [payError, setPayError] = useState<string | null>(null);
```

## Error Handling

- Empty array: use case returns early (no-op)
- Network error: revert optimistic update, display error near button
- Partial failure not possible: `updateMany` is atomic

## Testing

- Unit: `MarkInstallmentsPaidUseCase` — empty array no-op, delegates to repo
- Integration: `PrismaCreditCardPurchaseRepository.markInstallmentsPaid` — skips already-paid rows

## Out of Scope

- Undo/unmark paid
- Partial selection (checkboxes per row)
- Cross-card bulk pay
