# Duplicate Transaction Warning — Design

**Date:** 2026-05-07  
**Status:** Approved

---

## Problem

Users (or multiple household members) can accidentally submit the same transaction twice. The system has no guard against this. We want to warn — not block — when a likely duplicate is detected.

---

## Duplicate Rule

A transaction is considered a duplicate of an existing one if all three match:

- `type` — same (`EXPENSE` or `INCOME`)
- `amount` — exact numeric match
- `date` — same calendar day (year + month + day; time ignored)

Scope: current calendar month only. Cross-month duplicates are not checked.

---

## Approach: Frontend-only soft warning

### Why frontend-only

- Household transaction volume is small — fetching a month's worth is cheap
- User requested soft warn (not hard block), so backend enforcement adds no value
- No new API endpoints or domain changes needed

### Data fetch

On form mount, fetch the current month's transactions via the existing monthly-view endpoint:

```
GET /api/monthly-view?year=YYYY&month=MM
```

If the fetch fails, silently skip the duplicate check (log to console). Never block form submission due to check failure.

### Duplicate check hook

A shared hook `useDuplicateCheck` encapsulates fetch + match logic:

```ts
useDuplicateCheck(type: "EXPENSE" | "INCOME", amount: number | null, date: string | null)
// returns: { isDuplicate: boolean }
```

Reused by both `ExpenseForm` and `IncomeForm`.

Match logic:

```ts
existing.type === type &&
existing.amount === amount &&
sameDay(new Date(existing.date), new Date(date))
```

Where `sameDay` compares `year`, `month`, `day` only.

### UI warning

When `isDuplicate` is `true`, display an inline warning banner above the submit button:

> "A transaction with the same amount, date, and type already exists this month. You can still proceed."

User clicks submit → transaction saves normally. No blocking.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/transactions/ExpenseForm.tsx` | Add `useDuplicateCheck` call + warning banner |
| `src/components/transactions/IncomeForm.tsx` | Same |
| `src/hooks/useDuplicateCheck.ts` | New shared hook |

---

## Error handling

- Fetch fails → skip check silently, `isDuplicate = false`
- Amount or date not yet filled → skip check (`isDuplicate = false`)
- Partial input → no false positives

---

## Testing

- `useDuplicateCheck` unit-testable with mocked fetch
- Manual: add expense, try adding same again → warning appears, submit still works
- No domain tests needed (no domain change)

---

## Out of scope

- Hard reject / 409 from API
- Cross-month duplicate detection
- Installment purchase deduplication
