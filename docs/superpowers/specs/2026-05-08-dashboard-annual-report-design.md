# Dashboard & Annual Report Design

**Date:** 2026-05-08

## Overview

Unify the Monthly View and a new Annual Report into a single `/dashboard` page. Each section has its own period selector and person filter. The Annual Report shows yearly income, expenses, and balance — each as a card with year total at the top and month-by-month breakdown below.

---

## Domain Layer

### `src/domain/services/AnnualReport.ts`

New domain service. Pure function, no I/O.

**Input:**
```ts
type AnnualReportInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  year: number;
  personId?: string;
};
```

**Output:**
```ts
type MonthSummary = {
  month: number; // 1–12
  income: number;
  expenses: number;
  balance: number; // income - expenses
};

type AnnualReportResult = {
  year: number;
  months: MonthSummary[]; // always 12 entries
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
};
```

**Logic:**
- Filter transactions by `year` (UTC), optionally by `personId`
- Filter installments by `dueYear === year`, exclude canceled, optionally by `personId` via purchase join (installments have no personId — scope must be applied by caller)
- For each month 1–12: sum `INCOME` transactions → income; sum `EXPENSE` transactions + installment amounts → expenses; balance = income − expenses
- Compute year totals by summing all 12 months

---

## Application Layer

### `src/application/use-cases/GetAnnualReportUseCase.ts`

- Accepts `{ year, personId? }`, `ITransactionRepository`, `ICreditCardPurchaseRepository`
- Fetches all transactions for the year (repo must support year-scoped query or return all and let domain filter)
- Fetches all installments for the year scoped to personId at repo level
- Calls `buildAnnualReport(input)` from domain service
- Returns `AnnualReportResult`

---

## Infrastructure Layer

No new repos needed. Existing `ITransactionRepository` and `ICreditCardPurchaseRepository` are reused. If repos lack year-scoped queries, the use case passes full data and the domain service filters — acceptable for now.

---

## API Layer

### `src/app/api/annual-report/route.ts`

```
GET /api/annual-report?year=2025&personId=<optional>
```

**Response:**
```json
{
  "year": 2025,
  "totalIncome": 50000,
  "totalExpenses": 38000,
  "totalBalance": 12000,
  "months": [
    { "month": 1, "income": 4000, "expenses": 3000, "balance": 1000 },
    ...
  ]
}
```

**Validation:** `year` required, must be integer. `personId` optional.

---

## UI Layer

### Route change

- `/monthly-view` → `/dashboard`
- Nav link updated: "Monthly View" → "Dashboard"

### `src/app/dashboard/page.tsx` (server component)

Fetches both monthly view and annual report in parallel (`Promise.all`). Passes data to child components. Search params: `year`, `month`, `personId` (monthly), `annualYear`, `annualPersonId` (annual) — kept separate so sections navigate independently.

### Components

**`src/components/dashboard/YearNav.tsx`** (client)
- Mirrors `MonthNav` pattern
- `← Prev | 2025 | Next →` + person selector
- Pushes `annualYear` and `annualPersonId` to URL

**`src/components/dashboard/AnnualReportCards.tsx`**
- Receives `AnnualReportResult` + people list + current person
- Renders 3 cards side by side (responsive: stack on mobile)

**`src/components/dashboard/AnnualCard.tsx`**
- Props: `title`, `total`, `months: MonthSummary[]`, `field: 'income' | 'expenses' | 'balance'`
- Top: large total amount
- Bottom: table — Month | Amount (12 rows)
- Balance card colors: green if positive, red if negative (per row and total)

---

## Testing

- TDD for `buildAnnualReport` domain service
- Test cases: all months present, personId filter, installments counted as expenses, canceled installments excluded, balance sign correctness
- No UI tests required

---

## Nav Update

`src/app/layout.tsx` (or wherever nav links live): update "Monthly View" link href and label to point to `/dashboard`.

---

## Out of Scope

- Charts/graphs (numbers only)
- Recurring transactions in annual report (not in monthly-view either for simplicity)
- Export/download
