# Installment Purchases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `createInstallmentPurchase` and `cancelInstallmentPurchase` domain functions, fix installment rounding, update `buildMonthlyView` to exclude canceled installments, and add application use cases — making all 18 RED tests go GREEN.

**Architecture:** Domain-first. All business logic lives in `src/domain/`. Application use cases orchestrate domain + repository calls. No infrastructure (Prisma) changes. No UI.

**Tech Stack:** TypeScript, Jest + ts-jest, Clean Architecture (Domain → Application → Infrastructure).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/domain/services/InstallmentPurchase.ts` | Add `createInstallmentPurchase`, `cancelInstallmentPurchase`; fix rounding in `createInstallments`; add new types |
| Modify | `src/domain/repositories/ICreditCardPurchaseRepository.ts` | Add `isCanceled: boolean` to `InstallmentRecord`; add `cancelPurchase` to interface |
| Modify | `src/domain/services/MonthlyView.ts` | Filter out canceled installments |
| Create | `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts` | Orchestrate domain + repo save |
| Create | `src/application/use-cases/CancelInstallmentPurchaseUseCase.ts` | Orchestrate repo cancel |
| Modify | `tests/domain/repositories/ICreditCardPurchaseRepository.test.ts` | Add `isCanceled` to mock, add `cancelPurchase` to mock |

---

## Task 1: Add `isCanceled` to `InstallmentRecord` and `cancelPurchase` to repository interface

**Files:**
- Modify: `src/domain/repositories/ICreditCardPurchaseRepository.ts`
- Modify: `tests/domain/repositories/ICreditCardPurchaseRepository.test.ts`

Current `InstallmentRecord` (lines 12–21) has no `isCanceled` field. `ICreditCardPurchaseRepository` (lines 22–34) has no `cancelPurchase` method. Both must be updated before downstream code compiles.

- [ ] **Step 1: Update `InstallmentRecord` and add `cancelPurchase` to the interface**

Replace the full content of `src/domain/repositories/ICreditCardPurchaseRepository.ts`:

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
  cancelPurchase(purchaseId: string): Promise<void>;
}
```

- [ ] **Step 2: Update the repository contract test mock**

Replace the full content of `tests/domain/repositories/ICreditCardPurchaseRepository.test.ts`:

```typescript
import type {
  CreditCardPurchaseRecord,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

class MockCreditCardPurchaseRepository implements ICreditCardPurchaseRepository {
  async save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    _installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord> {
    return { ...purchase, createdAt: new Date() };
  }
  async findAllInstallmentsByMonth(_year: number, _month: number): Promise<InstallmentRecord[]> {
    return [];
  }
  async findInstallmentsByMonth(
    _personId: string,
    _year: number,
    _month: number,
  ): Promise<InstallmentRecord[]> {
    return [];
  }
  async markInstallmentPaid(_installmentId: string): Promise<void> {}
  async cancelPurchase(_purchaseId: string): Promise<void> {}
}

describe("ICreditCardPurchaseRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockCreditCardPurchaseRepository()).toBeDefined();
  });

  it("cancelPurchase is part of the contract", async () => {
    const repo = new MockCreditCardPurchaseRepository();
    await expect(repo.cancelPurchase("purchase-1")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run contract test to confirm it passes**

```bash
rtk jest tests/domain/repositories/ICreditCardPurchaseRepository.test.ts
```

Expected: `PASS (2) FAIL (0)`

- [ ] **Step 4: Commit**

```bash
git add src/domain/repositories/ICreditCardPurchaseRepository.ts tests/domain/repositories/ICreditCardPurchaseRepository.test.ts
git commit -m "feat(domain): add isCanceled to InstallmentRecord and cancelPurchase to repository contract"
```

---

## Task 2: Fix rounding in `createInstallments` and update types

**Files:**
- Modify: `src/domain/services/InstallmentPurchase.ts`

Current `createInstallments` divides without rounding (`totalAmount / numberOfInstallments`). This causes floating-point imprecision and, in the safe rounding test, produces `33.333...` instead of `33.33` + `33.34`. Fix: use `Math.floor` for base installments (never overshoots), last installment absorbs the remainder.

Also add the `InstallmentDraftWithPurchaseId` type and `PurchaseDraft` type needed by Tasks 3 and 4.

- [ ] **Step 1: Replace the full content of `src/domain/services/InstallmentPurchase.ts`**

```typescript
export type InstallmentDraft = {
  personId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
  categoryId: string | null;
};

export type InstallmentDraftWithPurchaseId = InstallmentDraft & {
  creditCardPurchaseId: string;
};

export type PurchaseDraft = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

type CreateInstallmentsInput = {
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createInstallments(input: CreateInstallmentsInput): InstallmentDraft[] {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (input.totalAmount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (input.numberOfInstallments < 1) {
    throw new Error("Number of installments must be at least 1");
  }

  const baseAmount = Math.floor((input.totalAmount / input.numberOfInstallments) * 100) / 100;

  if (baseAmount <= 0) {
    throw new Error("Amount too small for the number of installments");
  }

  const startYear = input.purchaseDate.getUTCFullYear();
  const startMonth = input.purchaseDate.getUTCMonth() + 1;

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const totalMonths = startMonth - 1 + i;
    const dueYear = startYear + Math.floor(totalMonths / 12);
    const dueMonth = (totalMonths % 12) + 1;

    const isLast = i === input.numberOfInstallments - 1;
    const amount = isLast
      ? roundCents(input.totalAmount - baseAmount * (input.numberOfInstallments - 1))
      : baseAmount;

    return {
      personId: input.personId,
      installmentNumber: i + 1,
      amount,
      dueYear,
      dueMonth,
      isPaid: false,
      isCanceled: false,
      categoryId: input.categoryId,
    };
  });
}
```

- [ ] **Step 2: Run existing `createInstallments` tests to verify no regressions**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts --testNamePattern="createInstallments"
```

Expected: All previously passing `createInstallments` tests still pass. The rounding test (`"rounding difference goes to last installment"`) should now also pass.

- [ ] **Step 3: Commit**

```bash
git add src/domain/services/InstallmentPurchase.ts
git commit -m "fix(domain): use floor rounding in createInstallments, last installment absorbs cent difference"
```

---

## Task 3: Add `createInstallmentPurchase` function

**Files:**
- Modify: `src/domain/services/InstallmentPurchase.ts`

Add `createInstallmentPurchase` to the same file. It validates `numberOfInstallments > 1`, calls the internal installment generation logic, and returns `{ purchase: PurchaseDraft, installments: InstallmentDraftWithPurchaseId[] }`.

- [ ] **Step 1: Run the failing `createInstallmentPurchase` tests to see current errors**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts --testNamePattern="createInstallmentPurchase"
```

Expected: `TypeError: createInstallmentPurchase is not a function` for all tests in that block.

- [ ] **Step 2: Add `createInstallmentPurchase` to `src/domain/services/InstallmentPurchase.ts`**

Append after the `createInstallments` function (keep everything already in the file):

```typescript
type CreateInstallmentPurchaseInput = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

type InstallmentPurchaseResult = {
  purchase: PurchaseDraft;
  installments: InstallmentDraftWithPurchaseId[];
};

export function createInstallmentPurchase(
  input: CreateInstallmentPurchaseInput,
): InstallmentPurchaseResult {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (input.totalAmount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (input.numberOfInstallments <= 1) {
    throw new Error("Number of installments must be greater than 1");
  }

  const drafts = createInstallments(input);

  const installments: InstallmentDraftWithPurchaseId[] = drafts.map((draft) => ({
    ...draft,
    creditCardPurchaseId: input.id,
  }));

  const purchase: PurchaseDraft = {
    id: input.id,
    personId: input.personId,
    totalAmount: input.totalAmount,
    numberOfInstallments: input.numberOfInstallments,
    purchaseDate: input.purchaseDate,
    description: input.description,
    categoryId: input.categoryId,
  };

  return { purchase, installments };
}
```

- [ ] **Step 3: Run `createInstallmentPurchase` tests**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts --testNamePattern="createInstallmentPurchase"
```

Expected: All tests in the `createInstallmentPurchase` describe block pass.

- [ ] **Step 4: Run all InstallmentPurchase tests to check for regressions**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts
```

Expected: `PASS` with no failures (the `createInstallments` tests still pass).

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/InstallmentPurchase.ts
git commit -m "feat(domain): add createInstallmentPurchase — returns purchase draft and linked installments"
```

---

## Task 4: Add `cancelInstallmentPurchase` function

**Files:**
- Modify: `src/domain/services/InstallmentPurchase.ts`

Pure function. Takes `InstallmentDraft[]`, returns same array with `isCanceled: true` on each. No validation needed.

- [ ] **Step 1: Run the failing cancel tests**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts --testNamePattern="cancelInstallmentPurchase"
```

Expected: `TypeError: cancelInstallmentPurchase is not a function`

- [ ] **Step 2: Add `cancelInstallmentPurchase` to `src/domain/services/InstallmentPurchase.ts`**

Append after `createInstallmentPurchase`:

```typescript
export function cancelInstallmentPurchase(
  installments: InstallmentDraft[],
): (InstallmentDraft & { isCanceled: true })[] {
  return installments.map((inst) => ({ ...inst, isCanceled: true as const }));
}
```

- [ ] **Step 3: Run cancel tests**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts --testNamePattern="cancelInstallmentPurchase"
```

Expected: All 4 cancel tests pass.

- [ ] **Step 4: Run full InstallmentPurchase suite**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts
```

Expected: `PASS` — all tests green, zero failures.

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/InstallmentPurchase.ts
git commit -m "feat(domain): add cancelInstallmentPurchase — marks all installments as canceled"
```

---

## Task 5: Update `buildMonthlyView` to exclude canceled installments

**Files:**
- Modify: `src/domain/services/MonthlyView.ts`

Add a filter so `isCanceled: true` installments never appear in the monthly view output.

- [ ] **Step 1: Run the failing MonthlyView cancel test**

```bash
rtk jest tests/domain/services/MonthlyView.test.ts --testNamePattern="canceled"
```

Expected: FAIL — `isCanceled` is not filtered.

- [ ] **Step 2: Update the installment filter in `src/domain/services/MonthlyView.ts`**

Replace:
```typescript
  const filteredInstallments = installments.filter(
    (i) => i.dueYear === year && i.dueMonth === month,
  );
```

With:
```typescript
  const filteredInstallments = installments.filter(
    (i) => i.dueYear === year && i.dueMonth === month && !i.isCanceled,
  );
```

- [ ] **Step 3: Run full MonthlyView suite**

```bash
rtk jest tests/domain/services/MonthlyView.test.ts
```

Expected: `PASS` — all tests green including the new canceled and total-amount tests.

- [ ] **Step 4: Commit**

```bash
git add src/domain/services/MonthlyView.ts
git commit -m "feat(domain): exclude canceled installments from monthly view"
```

---

## Task 6: Add `CreateInstallmentPurchaseUseCase`

**Files:**
- Create: `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts`

Mirrors the pattern of `CreateExpenseUseCase`. Calls `createInstallmentPurchase` from domain, then persists via `repo.save`.

- [ ] **Step 1: Create `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts`**

```typescript
import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

type Input = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

export async function createInstallmentPurchaseUseCase(
  input: Input,
  repo: ICreditCardPurchaseRepository,
) {
  const { purchase, installments } = createInstallmentPurchase(input);
  return repo.save(purchase, installments);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/CreateInstallmentPurchaseUseCase.ts
git commit -m "feat(application): add CreateInstallmentPurchaseUseCase"
```

---

## Task 7: Add `CancelInstallmentPurchaseUseCase`

**Files:**
- Create: `src/application/use-cases/CancelInstallmentPurchaseUseCase.ts`

Delegates to `repo.cancelPurchase`. The domain pure function `cancelInstallmentPurchase` is tested directly — the use case only orchestrates persistence.

- [ ] **Step 1: Create `src/application/use-cases/CancelInstallmentPurchaseUseCase.ts`**

```typescript
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function cancelInstallmentPurchaseUseCase(
  purchaseId: string,
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  await repo.cancelPurchase(purchaseId);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/CancelInstallmentPurchaseUseCase.ts
git commit -m "feat(application): add CancelInstallmentPurchaseUseCase"
```

---

## Task 8: Full test suite verification

**Files:** none — verification only.

- [ ] **Step 1: Run all tests**

```bash
rtk jest
```

Expected: All 54+ tests pass, zero failures.

- [ ] **Step 2: Confirm originally-RED tests are now GREEN**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts tests/domain/services/MonthlyView.test.ts tests/domain/entities/Transaction.test.ts
```

Expected: `PASS` on all three files.

- [ ] **Step 3: Update CHANGELOG.md**

Add under `## [Unreleased]` → `### Added`:

```markdown
- `src/domain/services/InstallmentPurchase.ts` — `createInstallmentPurchase()`: validates personId required, totalAmount > 0, numberOfInstallments > 1, baseAmount > 0 (catches too-small/too-many); returns `{ purchase: PurchaseDraft, installments: InstallmentDraftWithPurchaseId[] }` with `creditCardPurchaseId` on each installment
- `src/domain/services/InstallmentPurchase.ts` — `cancelInstallmentPurchase()`: pure function, marks all installments `isCanceled: true`, preserves all other fields
- `src/domain/services/InstallmentPurchase.ts` — `createInstallments()`: fixed rounding — uses `Math.floor` for base installments, last installment absorbs cent difference; validates `baseAmount > 0` to reject amount-too-small cases
- `src/domain/services/MonthlyView.ts` — `buildMonthlyView()`: excludes `isCanceled: true` installments from monthly view
- `src/domain/repositories/ICreditCardPurchaseRepository.ts` — `InstallmentRecord.isCanceled: boolean`; `cancelPurchase(purchaseId)` added to interface
- `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts` — orchestrates domain + repo save for installment purchases
- `src/application/use-cases/CancelInstallmentPurchaseUseCase.ts` — delegates purchase cancellation to repository
```

- [ ] **Step 4: Final commit**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for installment purchase implementation"
```
