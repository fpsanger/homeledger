# Dashboard & Annual Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/monthly-view` with a unified `/dashboard` page that shows the existing monthly view plus a new annual report (3 cards: income, expenses, balance — each with year total and month-by-month breakdown).

**Architecture:** New `buildAnnualReport` domain service aggregates transactions + installments by month for a full year. A new `GetAnnualReportUseCase` fetches data from existing repos. A new `/api/annual-report` route exposes it. The `/dashboard` page replaces `/monthly-view`, fetching both monthly and annual data server-side.

**Tech Stack:** TypeScript, Next.js 14 App Router, Prisma, Jest + ts-jest, Tailwind CSS, Biome

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/domain/services/AnnualReport.ts` | Pure aggregation logic |
| Create | `tests/domain/services/AnnualReport.test.ts` | TDD tests for domain service |
| Create | `src/application/use-cases/GetAnnualReportUseCase.ts` | Orchestrate repos → domain service |
| Create | `src/app/api/annual-report/route.ts` | HTTP handler |
| Create | `src/app/dashboard/page.tsx` | Unified dashboard server page |
| Create | `src/components/dashboard/YearNav.tsx` | Year + person selector (client) |
| Create | `src/components/dashboard/AnnualReportCards.tsx` | Renders 3 cards |
| Create | `src/components/dashboard/AnnualCard.tsx` | Single card: total + month table |
| Modify | `src/app/layout.tsx` | Nav link: Monthly View → Dashboard |
| Modify | `src/domain/repositories/ITransactionRepository.ts` | Add `findByYear` + `findByPersonAndYear` |
| Modify | `src/domain/repositories/ICreditCardPurchaseRepository.ts` | Add `findAllInstallmentsByYear` + `findInstallmentsByYear` |
| Modify | `src/infrastructure/repositories/PrismaTransactionRepository.ts` | Implement new repo methods |
| Modify | `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts` | Implement new repo methods |

---

## Task 1: Extend ITransactionRepository with year-scoped queries

**Files:**
- Modify: `src/domain/repositories/ITransactionRepository.ts`

- [ ] **Step 1: Add methods to interface**

Open `src/domain/repositories/ITransactionRepository.ts`. Add two methods to `ITransactionRepository`:

```ts
findByYear(year: number): Promise<TransactionRecord[]>;
findByPersonAndYear(personId: string, year: number): Promise<TransactionRecord[]>;
```

- [ ] **Step 2: Implement in Prisma repo**

Open `src/infrastructure/repositories/PrismaTransactionRepository.ts`. Add after `findByPersonAndMonth`:

```ts
async findByYear(year: number): Promise<TransactionRecord[]> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const rows = await this.prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
  });
  return rows.map(toRecord);
}

async findByPersonAndYear(personId: string, year: number): Promise<TransactionRecord[]> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const rows = await this.prisma.transaction.findMany({
    where: { personId, date: { gte: start, lt: end } },
  });
  return rows.map(toRecord);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/domain/repositories/ITransactionRepository.ts src/infrastructure/repositories/PrismaTransactionRepository.ts
git commit -m "feat: add year-scoped query methods to transaction repository"
```

---

## Task 2: Extend ICreditCardPurchaseRepository with year-scoped queries

**Files:**
- Modify: `src/domain/repositories/ICreditCardPurchaseRepository.ts`
- Modify: `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`

- [ ] **Step 1: Add methods to interface**

Open `src/domain/repositories/ICreditCardPurchaseRepository.ts`. Add to `ICreditCardPurchaseRepository`:

```ts
findAllInstallmentsByYear(year: number): Promise<InstallmentRecord[]>;
findInstallmentsByYear(personId: string, year: number): Promise<InstallmentRecord[]>;
```

- [ ] **Step 2: Implement in Prisma repo**

Open `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`. Add the two methods. Look at how `findAllInstallmentsByMonth` is implemented in that file and mirror the pattern, replacing the month filter with a year filter:

```ts
async findAllInstallmentsByYear(year: number): Promise<InstallmentRecord[]> {
  const rows = await this.prisma.installment.findMany({
    where: { dueYear: year },
  });
  return rows.map(toInstallmentRecord);
}

async findInstallmentsByYear(personId: string, year: number): Promise<InstallmentRecord[]> {
  const rows = await this.prisma.installment.findMany({
    where: {
      dueYear: year,
      creditCardPurchase: { personId },
    },
  });
  return rows.map(toInstallmentRecord);
}
```

> Note: `toInstallmentRecord` is the helper already used in that file. Check its exact name before copying.

- [ ] **Step 3: Commit**

```bash
git add src/domain/repositories/ICreditCardPurchaseRepository.ts src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts
git commit -m "feat: add year-scoped query methods to credit card purchase repository"
```

---

## Task 3: Domain service — buildAnnualReport (TDD)

**Files:**
- Create: `src/domain/services/AnnualReport.ts`
- Create: `tests/domain/services/AnnualReport.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/domain/services/AnnualReport.test.ts`:

```ts
import type { InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import { buildAnnualReport } from "../../../src/domain/services/AnnualReport";

const makeTransaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "txn-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: new Date("2025-01-15"),
  description: "Test",
  paymentMethod: "CASH",
  source: null,
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeInstallment = (overrides: Partial<InstallmentRecord> = {}): InstallmentRecord => ({
  id: "inst-1",
  creditCardPurchaseId: "purchase-1",
  installmentNumber: 1,
  amount: 200,
  dueYear: 2025,
  dueMonth: 1,
  isPaid: false,
  isCanceled: false,
  ...overrides,
});

describe("buildAnnualReport", () => {
  it("returns 12 month entries for the given year", () => {
    const result = buildAnnualReport({ transactions: [], installments: [], year: 2025 });
    expect(result.months).toHaveLength(12);
    expect(result.months[0].month).toBe(1);
    expect(result.months[11].month).toBe(12);
  });

  it("sums INCOME transactions by month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 1000, date: new Date("2025-03-10") }),
      makeTransaction({ id: "t2", type: "INCOME", amount: 500, date: new Date("2025-03-20") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[2].income).toBe(1500); // month index 2 = March
  });

  it("sums EXPENSE transactions by month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "EXPENSE", amount: 300, date: new Date("2025-05-05") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[4].expenses).toBe(300);
  });

  it("includes installment amounts in expenses", () => {
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 2 }),
    ];
    const result = buildAnnualReport({ transactions: [], installments, year: 2025 });
    expect(result.months[1].expenses).toBe(200);
  });

  it("excludes canceled installments", () => {
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 2, isCanceled: true }),
    ];
    const result = buildAnnualReport({ transactions: [], installments, year: 2025 });
    expect(result.months[1].expenses).toBe(0);
  });

  it("computes balance as income minus expenses per month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 1000, date: new Date("2025-06-01") }),
      makeTransaction({ id: "t2", type: "EXPENSE", amount: 400, date: new Date("2025-06-15") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[5].balance).toBe(600);
  });

  it("computes year totals", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 2000, date: new Date("2025-01-01") }),
      makeTransaction({ id: "t2", type: "EXPENSE", amount: 800, date: new Date("2025-01-15") }),
    ];
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 1 }),
    ];
    const result = buildAnnualReport({ transactions, installments, year: 2025 });
    expect(result.totalIncome).toBe(2000);
    expect(result.totalExpenses).toBe(1000);
    expect(result.totalBalance).toBe(1000);
  });

  it("filters by personId when provided", () => {
    const transactions = [
      makeTransaction({ id: "t1", personId: "person-1", type: "INCOME", amount: 1000, date: new Date("2025-01-01") }),
      makeTransaction({ id: "t2", personId: "person-2", type: "INCOME", amount: 999, date: new Date("2025-01-01") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025, personId: "person-1" });
    expect(result.totalIncome).toBe(1000);
  });

  it("ignores transactions from other years", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 5000, date: new Date("2024-12-31") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.totalIncome).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/domain/services/AnnualReport.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/domain/services/AnnualReport'`

- [ ] **Step 3: Implement domain service**

Create `src/domain/services/AnnualReport.ts`:

```ts
import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type AnnualReportInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  year: number;
  personId?: string;
};

export type MonthSummary = {
  month: number;
  income: number;
  expenses: number;
  balance: number;
};

export type AnnualReportResult = {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
};

export function buildAnnualReport(input: AnnualReportInput): AnnualReportResult {
  const { transactions, installments, year, personId } = input;

  const filteredTransactions = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getUTCFullYear() === year;
    })
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments.filter(
    (i) => i.dueYear === year && !i.isCanceled,
  );

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;

    const income = filteredTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && t.type === "INCOME";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTransactions = filteredTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && t.type === "EXPENSE";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseInstallments = filteredInstallments
      .filter((i) => i.dueMonth === month)
      .reduce((sum, i) => sum + i.amount, 0);

    const expenses = expenseTransactions + expenseInstallments;

    return { month, income, expenses, balance: income - expenses };
  });

  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);

  return {
    year,
    months,
    totalIncome,
    totalExpenses,
    totalBalance: totalIncome - totalExpenses,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/domain/services/AnnualReport.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/AnnualReport.ts tests/domain/services/AnnualReport.test.ts
git commit -m "feat: add AnnualReport domain service with TDD"
```

---

## Task 4: Application use case — GetAnnualReportUseCase

**Files:**
- Create: `src/application/use-cases/GetAnnualReportUseCase.ts`

- [ ] **Step 1: Create use case**

Create `src/application/use-cases/GetAnnualReportUseCase.ts`:

```ts
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { buildAnnualReport, type AnnualReportResult } from "../../domain/services/AnnualReport";

type Input = {
  year: number;
  personId?: string;
};

export async function getAnnualReportUseCase(
  input: Input,
  transactionRepo: ITransactionRepository,
  creditCardRepo: ICreditCardPurchaseRepository,
): Promise<AnnualReportResult> {
  const { year, personId } = input;

  const [transactions, installments] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndYear(personId, year)
      : transactionRepo.findByYear(year),
    personId
      ? creditCardRepo.findInstallmentsByYear(personId, year)
      : creditCardRepo.findAllInstallmentsByYear(year),
  ]);

  return buildAnnualReport({ transactions, installments, year, personId });
}
```

- [ ] **Step 2: Run all tests to check nothing broke**

```bash
rtk jest
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/GetAnnualReportUseCase.ts
git commit -m "feat: add GetAnnualReportUseCase"
```

---

## Task 5: API route — /api/annual-report

**Files:**
- Create: `src/app/api/annual-report/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/annual-report/route.ts`:

```ts
import { NextRequest } from "next/server";
import { getAnnualReportUseCase } from "../../../application/use-cases/GetAnnualReportUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const yearParam = searchParams.get("year");

    if (!yearParam) {
      return Response.json({ error: "year query param is required" }, { status: 400 });
    }

    const year = Number(yearParam);

    if (!Number.isInteger(year)) {
      return Response.json({ error: "year must be an integer" }, { status: 400 });
    }

    const personId = searchParams.get("personId") ?? undefined;

    const { transaction, creditCardPurchase } = createRepositories();
    const result = await getAnnualReportUseCase({ year, personId }, transaction, creditCardPurchase);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Verify route works manually**

Start dev server if not running:
```bash
rtk next dev
```

Test in browser or curl:
```bash
curl "http://localhost:3000/api/annual-report?year=2025"
```

Expected: JSON with `year`, `totalIncome`, `totalExpenses`, `totalBalance`, `months` array of 12.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/annual-report/route.ts
git commit -m "feat: add /api/annual-report route"
```

---

## Task 6: UI — YearNav component

**Files:**
- Create: `src/components/dashboard/YearNav.tsx`

- [ ] **Step 1: Create component**

Create `src/components/dashboard/YearNav.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };

type Props = {
  year: number;
  people: Person[];
  currentPersonId: string;
};

export function YearNav({ year, people, currentPersonId }: Props) {
  const router = useRouter();

  function navigate(newYear: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(newYear));
    if (currentPersonId) params.set("annualPersonId", currentPersonId);
    else params.delete("annualPersonId");
    router.push(`/dashboard?${params.toString()}`);
  }

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(year));
    if (e.target.value) params.set("annualPersonId", e.target.value);
    else params.delete("annualPersonId");
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(year - 1)}>← Prev</Button>
        <span className="font-semibold text-base w-16 text-center">{year}</span>
        <Button variant="outline" size="sm" onClick={() => navigate(year + 1)}>Next →</Button>
      </div>
      <Select value={currentPersonId} onChange={handlePersonChange} className="w-44">
        <option value="">All people</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/YearNav.tsx
git commit -m "feat: add YearNav component for annual report"
```

---

## Task 7: UI — AnnualCard and AnnualReportCards components

**Files:**
- Create: `src/components/dashboard/AnnualCard.tsx`
- Create: `src/components/dashboard/AnnualReportCards.tsx`

- [ ] **Step 1: Create AnnualCard**

Create `src/components/dashboard/AnnualCard.tsx`:

```tsx
import type { MonthSummary } from "@/domain/services/AnnualReport";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  title: string;
  total: number;
  months: MonthSummary[];
  field: "income" | "expenses" | "balance";
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export function AnnualCard({ title, total, months, field }: Props) {
  const isBalance = field === "balance";

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 min-w-0">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p
          className={`text-2xl font-bold ${
            isBalance ? (total >= 0 ? "text-green-600" : "text-red-600") : ""
          }`}
        >
          {formatAmount(total)}
        </p>
      </div>
      <div className="border-t pt-2">
        <table className="w-full text-sm">
          <tbody>
            {months.map((m) => {
              const value = m[field];
              return (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-1 text-muted-foreground">{MONTH_NAMES[m.month - 1]}</td>
                  <td
                    className={`py-1 text-right font-medium ${
                      isBalance ? (value >= 0 ? "text-green-600" : "text-red-600") : ""
                    }`}
                  >
                    {formatAmount(value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AnnualReportCards**

Create `src/components/dashboard/AnnualReportCards.tsx`:

```tsx
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualCard } from "./AnnualCard";

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportCards({ report }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AnnualCard
        title="Income"
        total={report.totalIncome}
        months={report.months}
        field="income"
      />
      <AnnualCard
        title="Expenses"
        total={report.totalExpenses}
        months={report.months}
        field="expenses"
      />
      <AnnualCard
        title="Balance"
        total={report.totalBalance}
        months={report.months}
        field="balance"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/AnnualCard.tsx src/components/dashboard/AnnualReportCards.tsx
git commit -m "feat: add AnnualCard and AnnualReportCards UI components"
```

---

## Task 8: Dashboard page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { AnnualReportCards } from "@/components/dashboard/AnnualReportCards";
import { YearNav } from "@/components/dashboard/YearNav";
import { Separator } from "@/components/ui/separator";

type Person = { id: string; name: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getMonthlyView(year: number, month: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/monthly-view?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return { transactions: [], installments: [] };
  return res.json();
}

async function getAnnualReport(year: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/annual-report?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

type SearchParams = {
  year?: string;
  month?: string;
  personId?: string;
  annualYear?: string;
  annualPersonId?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
  const personId = searchParams.personId ?? "";
  const annualYear = searchParams.annualYear ? parseInt(searchParams.annualYear, 10) : now.getFullYear();
  const annualPersonId = searchParams.annualPersonId ?? "";

  const [people, { transactions, installments }, annualReport] = await Promise.all([
    getPeople(),
    getMonthlyView(year, month, personId || undefined),
    getAnnualReport(annualYear, annualPersonId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Monthly View</h2>
          <MonthNav year={year} month={month} people={people} currentPersonId={personId} />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Transactions</h3>
          <TransactionTable transactions={transactions} people={people} />
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Installments</h3>
          <InstallmentTable installments={installments} />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Annual Report</h2>
          <YearNav year={annualYear} people={people} currentPersonId={annualPersonId} />
        </div>

        {annualReport ? (
          <AnnualReportCards report={annualReport} />
        ) : (
          <p className="text-muted-foreground text-sm">Failed to load annual report.</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add unified dashboard page with monthly and annual sections"
```

---

## Task 9: Update MonthNav to work from /dashboard

**Files:**
- Modify: `src/components/monthly-view/MonthNav.tsx`

The `MonthNav` currently hardcodes `/monthly-view` as the push target. It needs to push to `/dashboard` instead, preserving the annual search params.

- [ ] **Step 1: Update navigate and handlePersonChange in MonthNav**

Open `src/components/monthly-view/MonthNav.tsx`. Replace the `navigate` and `handlePersonChange` functions:

```ts
function navigate(newYear: number, newMonth: number) {
  const params = new URLSearchParams(window.location.search);
  params.set("year", String(newYear));
  params.set("month", String(newMonth));
  if (currentPersonId) params.set("personId", currentPersonId);
  else params.delete("personId");
  router.push(`/dashboard?${params.toString()}`);
}

function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
  const params = new URLSearchParams(window.location.search);
  params.set("year", String(year));
  params.set("month", String(month));
  if (e.target.value) params.set("personId", e.target.value);
  else params.delete("personId");
  router.push(`/dashboard?${params.toString()}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/monthly-view/MonthNav.tsx
git commit -m "fix: update MonthNav to navigate to /dashboard"
```

---

## Task 10: Update nav link and redirect /monthly-view

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/monthly-view/page.tsx` (add redirect)

- [ ] **Step 1: Update nav link**

Open `src/app/layout.tsx`. Change the Monthly View nav entry:

```ts
// Before:
{ href: "/monthly-view", label: "Monthly View" },

// After:
{ href: "/dashboard", label: "Dashboard" },
```

- [ ] **Step 2: Add redirect from /monthly-view to /dashboard**

Open `src/app/monthly-view/page.tsx`. Replace the entire file content with:

```ts
import { redirect } from "next/navigation";

export default function MonthlyViewPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/monthly-view/page.tsx
git commit -m "feat: update nav to Dashboard and redirect /monthly-view"
```

---

## Task 11: Smoke test the full feature

- [ ] **Step 1: Run all tests**

```bash
rtk jest
```

Expected: all tests PASS

- [ ] **Step 2: Start dev server and verify**

```bash
rtk next dev
```

Visit `http://localhost:3000/dashboard` and verify:
- Monthly section shows transactions and installments
- Annual section shows 3 cards (Income, Expenses, Balance)
- Each card shows year total at top and 12-month table below
- `← Prev | 2025 | Next →` works for both sections independently
- Person filter works for both sections independently
- Visiting `/monthly-view` redirects to `/dashboard`
- Nav shows "Dashboard" link

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix: address smoke test issues"
```
