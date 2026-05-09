# Installments Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/installments` page where users can view all credit card purchases with installments, filter by person, toggle canceled visibility, and mark installments as paid.

**Architecture:** Server-rendered page fetches data via a new `GET /api/credit-card-purchases` endpoint. A single client component handles person filter (URL param), show-canceled toggle (local state), and mark-paid (fetch + router.refresh). New use case + repository method added following existing patterns.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, Biome, Jest + ts-jest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/domain/repositories/ICreditCardPurchaseRepository.ts` | Modify | Add `findAllPurchasesWithInstallments(personId?: string)` to interface |
| `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts` | Modify | Implement `findAllPurchasesWithInstallments` |
| `src/application/use-cases/GetCreditCardPurchasesUseCase.ts` | Create | Use case: fetch purchases with installments, optional personId filter |
| `src/app/api/credit-card-purchases/route.ts` | Create | `GET /api/credit-card-purchases?personId=<id>` |
| `src/app/installments/page.tsx` | Create | Server component: fetch people + purchases, render `InstallmentsList` |
| `src/components/installments/InstallmentsList.tsx` | Create | Client component: filter dropdown, canceled toggle, mark-paid button |
| `tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts` | Create | Unit tests for the use case |

---

### Task 1: Extend domain repository interface

**Files:**
- Modify: `src/domain/repositories/ICreditCardPurchaseRepository.ts`

- [ ] **Step 1: Add return type and method to the interface**

Replace the existing `ICreditCardPurchaseRepository` interface in `src/domain/repositories/ICreditCardPurchaseRepository.ts`. Add the new type and method:

```typescript
export interface CreditCardPurchaseRecord {
  id: string;
  personId: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  categoryId: string | null;
  createdAt: Date;
}

export interface InstallmentRecord {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
}

export interface CreditCardPurchaseWithInstallments extends CreditCardPurchaseRecord {
  installments: InstallmentRecord[];
}

export interface ICreditCardPurchaseRepository {
  save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord>;
  findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]>;
  findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]>;
  markInstallmentPaid(installmentId: string): Promise<void>;
  findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]>;
  updateInstallments(installments: InstallmentRecord[]): Promise<void>;
  findAllPurchasesWithInstallments(personId?: string): Promise<CreditCardPurchaseWithInstallments[]>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors only about `findAllPurchasesWithInstallments` not implemented in `PrismaCreditCardPurchaseRepository` (that's fine — we fix it next task).

- [ ] **Step 3: Commit**

```bash
git add src/domain/repositories/ICreditCardPurchaseRepository.ts
git commit -m "feat: add findAllPurchasesWithInstallments to ICreditCardPurchaseRepository"
```

---

### Task 2: Implement repository method

**Files:**
- Modify: `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`

- [ ] **Step 1: Add the implementation**

Add this method inside the `PrismaCreditCardPurchaseRepository` class (after `updateInstallments`):

```typescript
async findAllPurchasesWithInstallments(
  personId?: string,
): Promise<CreditCardPurchaseWithInstallments[]> {
  const rows = await this.prisma.creditCardPurchase.findMany({
    where: personId ? { personId } : undefined,
    include: { installments: true },
    orderBy: { purchaseDate: "desc" },
  });
  return rows.map((row) => ({
    ...purchaseToRecord(row),
    installments: row.installments.map(installmentToRecord),
  }));
}
```

Also add the import for `CreditCardPurchaseWithInstallments` at the top of the file:

```typescript
import type {
  CreditCardPurchaseRecord,
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts
git commit -m "feat: implement findAllPurchasesWithInstallments in Prisma repository"
```

---

### Task 3: Write use case with TDD

**Files:**
- Create: `src/application/use-cases/GetCreditCardPurchasesUseCase.ts`
- Create: `tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts`:

```typescript
import { getCreditCardPurchasesUseCase } from "../../../src/application/use-cases/GetCreditCardPurchasesUseCase";
import type {
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
} from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

const makeInstallment = (overrides = {}) => ({
  id: "inst-1",
  creditCardPurchaseId: "p-1",
  installmentNumber: 1,
  amount: 100,
  dueYear: 2026,
  dueMonth: 5,
  isPaid: false,
  isCanceled: false,
  ...overrides,
});

const makePurchase = (overrides = {}): CreditCardPurchaseWithInstallments => ({
  id: "p-1",
  personId: "person-1",
  description: "TV",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-01-01"),
  categoryId: null,
  createdAt: new Date("2026-01-01"),
  installments: [makeInstallment()],
  ...overrides,
});

const makeRepo = (
  purchases: CreditCardPurchaseWithInstallments[] = [],
): Pick<ICreditCardPurchaseRepository, "findAllPurchasesWithInstallments"> => ({
  findAllPurchasesWithInstallments: async (personId?: string) => {
    if (personId) return purchases.filter((p) => p.personId === personId);
    return purchases;
  },
});

describe("getCreditCardPurchasesUseCase", () => {
  it("returns all purchases when no personId given", async () => {
    const purchases = [makePurchase({ id: "p-1" }), makePurchase({ id: "p-2", personId: "person-2" })];
    const repo = makeRepo(purchases);
    const result = await getCreditCardPurchasesUseCase(undefined, repo as ICreditCardPurchaseRepository);
    expect(result).toHaveLength(2);
  });

  it("returns only purchases for given personId", async () => {
    const purchases = [
      makePurchase({ id: "p-1", personId: "person-1" }),
      makePurchase({ id: "p-2", personId: "person-2" }),
    ];
    const repo = makeRepo(purchases);
    const result = await getCreditCardPurchasesUseCase("person-1", repo as ICreditCardPurchaseRepository);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-1");
  });

  it("returns empty array when no purchases", async () => {
    const repo = makeRepo([]);
    const result = await getCreditCardPurchasesUseCase(undefined, repo as ICreditCardPurchaseRepository);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../../src/application/use-cases/GetCreditCardPurchasesUseCase'`

- [ ] **Step 3: Implement the use case**

Create `src/application/use-cases/GetCreditCardPurchasesUseCase.ts`:

```typescript
import type {
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
} from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function getCreditCardPurchasesUseCase(
  personId: string | undefined,
  repo: ICreditCardPurchaseRepository,
): Promise<CreditCardPurchaseWithInstallments[]> {
  return repo.findAllPurchasesWithInstallments(personId);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/GetCreditCardPurchasesUseCase.ts tests/application/use-cases/GetCreditCardPurchasesUseCase.test.ts
git commit -m "feat: add GetCreditCardPurchasesUseCase with tests"
```

---

### Task 4: Add API route

**Files:**
- Create: `src/app/api/credit-card-purchases/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/credit-card-purchases/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { getCreditCardPurchasesUseCase } from "../../../application/use-cases/GetCreditCardPurchasesUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId") ?? undefined;
    const { creditCard } = createRepositories();
    const purchases = await getCreditCardPurchasesUseCase(personId, creditCard);
    return Response.json({ purchases });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/credit-card-purchases/route.ts
git commit -m "feat: add GET /api/credit-card-purchases route"
```

---

### Task 5: Build InstallmentsList client component

**Files:**
- Create: `src/components/installments/InstallmentsList.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/installments/InstallmentsList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Person = { id: string; name: string };

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
};

type Purchase = {
  id: string;
  personId: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: string;
  categoryId: string | null;
  installments: Installment[];
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  people: Person[];
  purchases: Purchase[];
  currentPersonId: string;
};

export function InstallmentsList({ people, purchases, currentPersonId }: Props) {
  const router = useRouter();
  const [showCanceled, setShowCanceled] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const personId = e.target.value;
    const params = new URLSearchParams();
    if (personId) params.set("personId", personId);
    router.push(`/installments${params.size ? `?${params.toString()}` : ""}`);
  }

  async function markPaid(installmentId: string) {
    setError(null);
    setPendingId(installmentId);
    const res = await fetch(`/api/installments/${installmentId}/paid`, { method: "PATCH" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to mark installment as paid.");
      return;
    }
    router.refresh();
  }

  function statusBadge(inst: Installment) {
    if (inst.isCanceled) return <span className="text-xs text-muted-foreground">Canceled</span>;
    if (inst.isPaid) return <span className="text-xs text-green-600 font-medium">Paid</span>;
    return <span className="text-xs text-yellow-600 font-medium">Pending</span>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="person-filter">Person</Label>
          <Select
            id="person-filter"
            value={currentPersonId}
            onChange={handlePersonChange}
          >
            <option value="">All people</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <input
            id="show-canceled"
            type="checkbox"
            checked={showCanceled}
            onChange={(e) => setShowCanceled(e.target.checked)}
          />
          <label htmlFor="show-canceled" className="text-sm">Show canceled</label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {purchases.length === 0 && (
        <p className="text-sm text-muted-foreground">No purchases found.</p>
      )}

      {purchases.map((purchase) => {
        const visibleInstallments = purchase.installments.filter(
          (i) => showCanceled || !i.isCanceled,
        );
        return (
          <div key={purchase.id} className="border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{purchase.description || "No description"}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(purchase.purchaseDate).toLocaleDateString()} ·{" "}
                  {purchase.numberOfInstallments}x ·{" "}
                  R$ {purchase.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {visibleInstallments.length === 0 && (
              <p className="text-sm text-muted-foreground">No installments to show.</p>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-1 font-normal">#</th>
                  <th className="pb-1 font-normal">Due</th>
                  <th className="pb-1 font-normal">Amount</th>
                  <th className="pb-1 font-normal">Status</th>
                  <th className="pb-1 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {visibleInstallments.map((inst) => (
                  <tr key={inst.id} className="border-b last:border-0">
                    <td className="py-1.5">{inst.installmentNumber}</td>
                    <td className="py-1.5">{MONTH_NAMES[inst.dueMonth - 1]}/{inst.dueYear}</td>
                    <td className="py-1.5">R$ {inst.amount.toFixed(2)}</td>
                    <td className="py-1.5">{statusBadge(inst)}</td>
                    <td className="py-1.5 text-right">
                      {!inst.isPaid && !inst.isCanceled && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === inst.id}
                          onClick={() => markPaid(inst.id)}
                        >
                          {pendingId === inst.id ? "Saving…" : "Mark Paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/installments/InstallmentsList.tsx
git commit -m "feat: add InstallmentsList client component"
```

---

### Task 6: Build the page

**Files:**
- Create: `src/app/installments/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/installments/page.tsx`:

```tsx
import { InstallmentsList } from "@/components/installments/InstallmentsList";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type Person = { id: string; name: string };

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getPurchases(personId?: string) {
  const params = personId ? `?personId=${personId}` : "";
  const res = await fetch(`${BASE_URL}/api/credit-card-purchases${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.purchases;
}

type SearchParams = { personId?: string };

export default async function InstallmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const personId = searchParams.personId ?? "";
  const [people, purchases] = await Promise.all([
    getPeople(),
    getPurchases(personId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Installments</h1>
      <InstallmentsList
        people={people}
        purchases={purchases}
        currentPersonId={personId}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to ensure nothing broken**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and manually test**

```bash
npm run dev
```

Visit `http://localhost:3000/installments` and verify:
- Page loads with all purchases listed
- Each purchase shows all installments (except canceled when toggle is off)
- Person filter dropdown works (URL updates to `?personId=...`)
- "All people" option shows all purchases
- "Show canceled" toggle reveals/hides canceled installments
- "Mark Paid" button marks an installment paid and refreshes (button disappears, badge shows "Paid")
- Error message shows if mark-paid fails

- [ ] **Step 4: Commit**

```bash
git add src/app/installments/page.tsx
git commit -m "feat: add /installments page"
```

---

### Task 7: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry**

Add to the top of `CHANGELOG.md` under the appropriate version/date:

```markdown
## [Unreleased]

### Added
- `/installments` page: view all credit card purchases with installments, filter by person, toggle canceled visibility, mark installments as paid
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for installments page"
```
