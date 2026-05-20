# UI Modernization Design

**Date:** 2026-05-08  
**Approach:** Incremental polish (Option A) — touch existing components minimally, no structural rewrites, no domain logic changes.

---

## Goals

- Modern, clean, calm, practical daily-use UI
- Consistent visual language across all screens
- Add category breakdown chart to dashboard
- No business logic moved into UI
- No new pages, no architectural changes

---

## Tech Constraints

- Tailwind CSS + shadcn/ui (already installed)
- lucide-react for icons (already installed)
- Install `recharts` for category donut chart
- Next.js 14 App Router — no client-side routing changes

---

## 1. Layout Shell (`src/app/layout.tsx`)

- Nav height: `h-16`, sticky top
- Logo left: lucide `Home` icon + "HomeLedger" text, green accent
- Nav links right: active state via solid bottom border + bolder text (requires client component or pathname detection)
- Widen content: `max-w-6xl` (from `max-w-5xl`)
- Consistent `px-6 py-8` page padding

---

## 2. Page Header Pattern

All pages get a consistent header block:

```
[Page Title]        [Action Button]
[optional subtitle / count badge]
```

- Title: `text-2xl font-semibold`
- Action button: primary, right-aligned (e.g. "+ Add Transaction")
- Count badge: muted pill showing record count where relevant

---

## 3. Dashboard — Annual Report Cards (`AnnualCard.tsx`)

- Layout: icon top-left, large metric value, small muted label, month sparkline below
- Left border accent: green (income), red (expenses), conditional green/red (balance)
- `shadow-sm`, `rounded-lg`, white card
- Icons: `TrendingUp` (income), `TrendingDown` (expenses), `Scale` (balance)

---

## 4. Dashboard — Category Breakdown Chart (new `CategoryBreakdownChart.tsx`)

- Recharts `PieChart` with `innerRadius` (donut style)
- Data source: existing `/api/monthly-view` response — group transactions by category client-side, OR new `/api/category-breakdown?year=&month=&personId=` endpoint
- Layout: chart left (~40%), legend + amounts right (~60%)
- Position: between annual cards and monthly tabs card
- Colors: use a fixed palette of 8 muted tones derived from existing CSS vars
- Empty state: centered icon + "No expense data for this month"

**API decision:** prefer grouping client-side from existing `transactions` data passed to `MonthlyTabsCard` — avoids new endpoint. Dashboard page passes category-annotated transactions.

> Note: transactions currently lack `categoryName` in the monthly-view response. Need to verify API response shape and add category info if missing.

---

## 5. Dashboard — Monthly Tabs Card (`MonthlyTabsCard.tsx`)

- Tabs: pill-style buttons (replace underline tabs)
- Month nav: prev/next arrow buttons with `MMM YYYY` label centered
- Person filter: compact `<Select>` inline with month nav
- Count badge on tabs: already exists, keep and polish

---

## 6. Transaction Table (`TransactionTable.tsx`)

- Type column: replace colored text with pill badge (`rounded-full px-2 py-0.5 text-xs font-medium`)
  - Income: `bg-green-50 text-green-700 border border-green-200`
  - Expense: `bg-red-50 text-red-700 border border-red-200`
- Date: format as `DD MMM` (e.g. "07 Mai")
- Amount: right-aligned, monospace, color-coded
- Delete: `Trash2` icon button, ghost variant, no label
- Summary bar: `Income | Expenses | Balance` with colored values, top border separator
- Empty state: centered `Receipt` icon + message

---

## 7. Forms (`UnifiedTransactionForm.tsx`, `ExpenseForm.tsx`, `IncomeForm.tsx`, `InstallmentForm.tsx`)

- Consistent `grid gap-4` layout
- Labels above inputs (already mostly done)
- Section headers for grouped fields: "Payment Details", "Category"
- Submit button: full-width, primary
- No logic changes

---

## 8. Other Pages (categories, people, credit-cards, installments)

Same polish pattern applied consistently:

| Page | Changes |
|------|---------|
| Categories | Page header + count badge, icon delete buttons, empty state |
| People | Page header, icon delete buttons, empty state |
| Credit Cards | Page header, icon delete buttons, empty state |
| Installments | Page header, badge for paid/canceled status, icon buttons, empty state |

---

## Out of Scope

- Sidebar layout (keep top nav)
- Dark mode toggle UI
- Responsive/mobile layout beyond what Tailwind grid provides
- New pages or routes
- Any domain/application layer changes
- Filters (month, person, category) beyond what already exists

---

## File Change Surface

| File | Change Type |
|------|-------------|
| `src/app/layout.tsx` | Modify — nav modernization |
| `src/app/globals.css` | Modify — minor additions if needed |
| `src/components/dashboard/AnnualCard.tsx` | Modify — icon + border accent |
| `src/components/dashboard/AnnualReportCards.tsx` | Modify — minor layout tweak |
| `src/components/dashboard/MonthlyTabsCard.tsx` | Modify — pill tabs |
| `src/components/dashboard/YearNav.tsx` | Modify — arrow buttons |
| `src/components/monthly-view/MonthNav.tsx` | Modify — arrow buttons + label |
| `src/components/monthly-view/TransactionTable.tsx` | Modify — badges, icon delete, summary bar, empty state |
| `src/components/monthly-view/InstallmentTable.tsx` | Modify — badges, icon delete, empty state |
| `src/components/dashboard/CategoryBreakdownChart.tsx` | **New** — recharts donut chart |
| `src/app/dashboard/page.tsx` | Modify — add CategoryBreakdownChart |
| `src/components/transactions/UnifiedTransactionForm.tsx` | Modify — layout polish |
| `src/components/categories/CategoryList.tsx` | Modify — page header, icon delete, empty state |
| `src/components/installments/InstallmentsList.tsx` | Modify — badges, icon delete, empty state |
| `src/components/people/PersonList.tsx` | Modify — page header, icon delete, empty state |
| `src/components/credit-cards/CreditCardList.tsx` | Modify — page header, icon delete, empty state |
