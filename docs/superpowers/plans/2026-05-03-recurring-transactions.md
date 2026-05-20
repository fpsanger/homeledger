# Recurring Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement recurring transactions that generate on-the-fly monthly occurrences in the monthly view, with cancel and split-rule update semantics.

**Architecture:** A domain service (`RecurringTransaction.ts`) provides pure functions for creating, validating, and computing occurrences. The monthly view merges computed occurrences into its transactions output. Three use cases orchestrate repo calls around domain logic.

**Tech Stack:** TypeScript, Jest + ts-jest (`rtk jest`), Clean Architecture (domain → application layers only)

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/domain/repositories/IRecurringTransactionRepository.ts` | Add `frequency`, `findById`, `update` |
| Create | `src/domain/services/RecurringTransaction.ts` | Pure domain functions |
| Modify | `src/domain/services/MonthlyView.ts` | Merge recurring occurrences into output |
| Modify | `src/application/use-cases/GetMonthlyViewUseCase.ts` | Add recurring repo param |
| Create | `src/application/use-cases/CreateRecurringTransactionUseCase.ts` | Create rule use case |
| Create | `src/application/use-cases/CancelRecurringTransactionUseCase.ts` | Cancel rule use case |
| Create | `src/application/use-cases/UpdateRecurringTransactionUseCase.ts` | Split-rule update use case |
| Modify | `tests/domain/repositories/IRecurringTransactionRepository.test.ts` | Update mock |
| Create | `tests/domain/services/RecurringTransaction.test.ts` | Domain service tests (TDD) |
| Modify | `tests/domain/services/MonthlyView.test.ts` | Add recurring occurrence tests |
| Create | `tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts` | |
| Create | `tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts` | |
| Create | `tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts` | |

---

## Task 1: Update IRecurringTransactionRepository interface

**Files:**
- Modify: `src/domain/repositories/IRecurringTransactionRepository.ts`
- Modify: `tests/domain/repositories/IRecurringTransactionRepository.test.ts`

- [ ] **Step 1: Replace the entire repository interface file**

```typescript
// src/domain/repositories/IRecurringTransactionRepository.ts
export interface RecurringTransactionRecord {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UpdateableFields = Partial<
  Pick<
    RecurringTransactionRecord,
    "endDate" | "amount" | "description" | "categoryId" | "paymentMethod" | "startDate" | "frequency"
  >
>;

export interface IRecurringTransactionRepository {
  findById(id: string): Promise<RecurringTransactionRecord | null>;
  findActiveByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<RecurringTransactionRecord[]>;
  findAllActiveByMonth(year: number, month: number): Promise<RecurringTransactionRecord[]>;
  save(
    record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord>;
  update(id: string, changes: UpdateableFields): Promise<RecurringTransactionRecord>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 2: Update the mock test to implement new methods**

```typescript
// tests/domain/repositories/IRecurringTransactionRepository.test.ts
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

class MockRecurringTransactionRepository implements IRecurringTransactionRepository {
  async findById(_id: string): Promise<RecurringTransactionRecord | null> {
    return null;
  }
  async findActiveByPersonAndMonth(
    _personId: string,
    _year: number,
    _month: number,
  ): Promise<RecurringTransactionRecord[]> {
    return [];
  }
  async findAllActiveByMonth(
    _year: number,
    _month: number,
  ): Promise<RecurringTransactionRecord[]> {
    return [];
  }
  async save(
    r: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    return { ...r, createdAt: new Date(), updatedAt: new Date() };
  }
  async update(
    _id: string,
    _changes: Partial<RecurringTransactionRecord>,
  ): Promise<RecurringTransactionRecord> {
    return {} as RecurringTransactionRecord;
  }
  async delete(_id: string): Promise<void> {}
}

describe("IRecurringTransactionRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockRecurringTransactionRepository()).toBeDefined();
  });
});
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
rtk jest tests/domain/repositories/IRecurringTransactionRepository.test.ts
```

Expected: PASS (1 test)

- [ ] **Step 4: Commit**

```bash
git add src/domain/repositories/IRecurringTransactionRepository.ts \
        tests/domain/repositories/IRecurringTransactionRepository.test.ts
git commit -m "feat(domain): add frequency, findById, update to IRecurringTransactionRepository"
```

---

## Task 2: createRecurringTransaction — TDD

**Files:**
- Create: `tests/domain/services/RecurringTransaction.test.ts`
- Create: `src/domain/services/RecurringTransaction.ts`

- [ ] **Step 1: Write failing tests for createRecurringTransaction**

```typescript
// tests/domain/services/RecurringTransaction.test.ts
import {
  createRecurringTransaction,
} from "../../../src/domain/services/RecurringTransaction";
import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";

const baseInput = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX" as const,
  categoryId: null,
  frequency: "MONTHLY" as const,
  startDate: new Date("2026-01-01"),
  endDate: null,
};

describe("RecurringTransaction service", () => {
  describe("createRecurringTransaction", () => {
    it("returns a record with all input fields", () => {
      const record = createRecurringTransaction(baseInput);

      expect(record.id).toBe("rule-1");
      expect(record.personId).toBe("person-1");
      expect(record.type).toBe("EXPENSE");
      expect(record.amount).toBe(500);
      expect(record.frequency).toBe("MONTHLY");
      expect(record.startDate).toEqual(new Date("2026-01-01"));
      expect(record.endDate).toBeNull();
    });

    it("throws when personId is missing", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, personId: "" }),
      ).toThrow("Person is required");
    });

    it("throws when amount is zero", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, amount: 0 }),
      ).toThrow("Amount must be positive");
    });

    it("throws when amount is negative", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, amount: -100 }),
      ).toThrow("Amount must be positive");
    });

    it("accepts an endDate", () => {
      const record = createRecurringTransaction({
        ...baseInput,
        endDate: new Date("2026-12-31"),
      });

      expect(record.endDate).toEqual(new Date("2026-12-31"));
    });

    it("preserves categoryId", () => {
      const record = createRecurringTransaction({
        ...baseInput,
        categoryId: "cat-1",
      });

      expect(record.categoryId).toBe("cat-1");
    });

    it("throws when startDate is missing", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, startDate: null as unknown as Date }),
      ).toThrow("Start date is required");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement createRecurringTransaction**

```typescript
// src/domain/services/RecurringTransaction.ts
import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type CreateRecurringInput = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: RecurringTransactionRecord["paymentMethod"];
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
};

export function createRecurringTransaction(
  input: CreateRecurringInput,
): RecurringTransactionRecord {
  if (!input.personId) throw new Error("Person is required");
  if (input.amount <= 0) throw new Error("Amount must be positive");
  if (!input.startDate) throw new Error("Start date is required");

  return {
    id: input.id,
    personId: input.personId,
    type: input.type,
    amount: input.amount,
    description: input.description,
    paymentMethod: input.paymentMethod,
    categoryId: input.categoryId,
    frequency: input.frequency,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/RecurringTransaction.ts \
        tests/domain/services/RecurringTransaction.test.ts
git commit -m "feat(domain): add createRecurringTransaction with validation"
```

---

## Task 3: isActiveInMonth — TDD

**Files:**
- Modify: `tests/domain/services/RecurringTransaction.test.ts`
- Modify: `src/domain/services/RecurringTransaction.ts`

Active-in-month semantics: rule is active for `(year, month)` when `yearMonth(startDate) ≤ (year, month)` AND `(endDate is null OR yearMonth(endDate) > (year, month))`. A rule canceled on May 15 sets endDate=May 15, which means May is excluded (endDate's year-month = May = not strictly greater than May).

- [ ] **Step 1: Add failing tests for isActiveInMonth**

Append to the `describe("RecurringTransaction service")` block in `tests/domain/services/RecurringTransaction.test.ts`:

```typescript
import {
  createRecurringTransaction,
  isActiveInMonth,
} from "../../../src/domain/services/RecurringTransaction";
```

And add inside `describe("RecurringTransaction service", () => {`:

```typescript
    describe("isActiveInMonth", () => {
      const makeRule = (
        startDate: Date,
        endDate: Date | null = null,
      ): RecurringTransactionRecord => ({
        id: "rule-1",
        personId: "person-1",
        type: "EXPENSE",
        amount: 100,
        description: "Test",
        paymentMethod: "PIX",
        categoryId: null,
        frequency: "MONTHLY",
        startDate,
        endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      it("is active when startDate is in the target month", () => {
        const rule = makeRule(new Date("2026-05-15"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
      });

      it("is active when startDate is before the target month", () => {
        const rule = makeRule(new Date("2026-01-01"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
      });

      it("is not active when startDate is after the target month", () => {
        const rule = makeRule(new Date("2026-06-01"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
      });

      it("is active when endDate is null (indefinite)", () => {
        const rule = makeRule(new Date("2026-01-01"), null);
        expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
      });

      it("is not active when endDate is in the target month (canceled this month)", () => {
        const rule = makeRule(new Date("2026-01-01"), new Date("2026-05-15"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
      });

      it("is not active when endDate is before the target month", () => {
        const rule = makeRule(new Date("2026-01-01"), new Date("2026-04-01"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
      });

      it("is active when endDate is in the month after the target", () => {
        const rule = makeRule(new Date("2026-01-01"), new Date("2026-06-01"));
        expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
      });

      it("handles year rollover correctly", () => {
        const rule = makeRule(new Date("2025-11-01"), new Date("2026-02-01"));
        expect(isActiveInMonth(rule, 2026, 1)).toBe(true);
        expect(isActiveInMonth(rule, 2026, 2)).toBe(false);
      });
    });
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: FAIL — "isActiveInMonth is not a function"

- [ ] **Step 3: Add isActiveInMonth to the service**

Append to `src/domain/services/RecurringTransaction.ts`:

```typescript
function yearMonthOf(date: Date): { y: number; m: number } {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1 };
}

function compareYearMonth(a: { y: number; m: number }, b: { y: number; m: number }): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.m - b.m;
}

export function isActiveInMonth(
  rule: RecurringTransactionRecord,
  year: number,
  month: number,
): boolean {
  const target = { y: year, m: month };
  const start = yearMonthOf(rule.startDate);

  if (compareYearMonth(start, target) > 0) return false;
  if (rule.endDate === null) return true;

  const end = yearMonthOf(rule.endDate);
  return compareYearMonth(end, target) > 0;
}
```

- [ ] **Step 4: Run all service tests to verify they pass**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: PASS (14 tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/RecurringTransaction.ts \
        tests/domain/services/RecurringTransaction.test.ts
git commit -m "feat(domain): add isActiveInMonth with year-month comparison semantics"
```

---

## Task 4: generateOccurrence — TDD

**Files:**
- Modify: `tests/domain/services/RecurringTransaction.test.ts`
- Modify: `src/domain/services/RecurringTransaction.ts`

- [ ] **Step 1: Add failing tests for generateOccurrence**

Update the import line at the top of the test file:

```typescript
import {
  createRecurringTransaction,
  generateOccurrence,
  isActiveInMonth,
} from "../../../src/domain/services/RecurringTransaction";
```

Add inside `describe("RecurringTransaction service", () => {`:

```typescript
    describe("generateOccurrence", () => {
      const rule: RecurringTransactionRecord = {
        id: "rule-1",
        personId: "person-1",
        type: "EXPENSE",
        amount: 500,
        description: "Rent",
        paymentMethod: "PIX",
        categoryId: "cat-1",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-15"),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("returns a TransactionRecord with the rule id", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.id).toBe("rule-1");
      });

      it("preserves personId", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.personId).toBe("person-1");
      });

      it("preserves categoryId", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.categoryId).toBe("cat-1");
      });

      it("preserves amount", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.amount).toBe(500);
      });

      it("preserves type", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.type).toBe("EXPENSE");
      });

      it("preserves paymentMethod", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.paymentMethod).toBe("PIX");
      });

      it("date is in the target month and year", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.date.getUTCFullYear()).toBe(2026);
        expect(occ.date.getUTCMonth() + 1).toBe(5);
      });

      it("date preserves the day from startDate", () => {
        const occ = generateOccurrence(rule, 2026, 5);
        expect(occ.date.getUTCDate()).toBe(15);
      });

      it("clamps day to last day of month when startDate day exceeds month length", () => {
        const jan31Rule: RecurringTransactionRecord = {
          ...rule,
          startDate: new Date("2026-01-31"),
        };
        const occ = generateOccurrence(jan31Rule, 2026, 2); // Feb has 28 days in 2026
        expect(occ.date.getUTCDate()).toBe(28);
        expect(occ.date.getUTCMonth() + 1).toBe(2);
      });
    });
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: FAIL — "generateOccurrence is not a function"

- [ ] **Step 3: Add generateOccurrence to the service**

Append to `src/domain/services/RecurringTransaction.ts`:

```typescript
export function generateOccurrence(
  rule: RecurringTransactionRecord,
  year: number,
  month: number,
): TransactionRecord {
  const startDay = rule.startDate.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(startDay, lastDayOfMonth);

  return {
    id: rule.id,
    personId: rule.personId,
    type: rule.type,
    amount: rule.amount,
    date: new Date(Date.UTC(year, month - 1, day)),
    description: rule.description,
    paymentMethod: rule.paymentMethod,
    categoryId: rule.categoryId,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: PASS (23 tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/RecurringTransaction.ts \
        tests/domain/services/RecurringTransaction.test.ts
git commit -m "feat(domain): add generateOccurrence — maps rule to TransactionRecord for target month"
```

---

## Task 5: cancelRecurringTransaction + updateRecurringTransaction — TDD

**Files:**
- Modify: `tests/domain/services/RecurringTransaction.test.ts`
- Modify: `src/domain/services/RecurringTransaction.ts`

- [ ] **Step 1: Add failing tests**

Update the import line at the top of the test file:

```typescript
import {
  cancelRecurringTransaction,
  createRecurringTransaction,
  generateOccurrence,
  isActiveInMonth,
  updateRecurringTransaction,
} from "../../../src/domain/services/RecurringTransaction";
```

Add inside `describe("RecurringTransaction service", () => {`:

```typescript
    describe("cancelRecurringTransaction", () => {
      const rule: RecurringTransactionRecord = {
        id: "rule-1",
        personId: "person-1",
        type: "EXPENSE",
        amount: 500,
        description: "Rent",
        paymentMethod: "PIX",
        categoryId: null,
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("sets endDate to today", () => {
        const today = new Date("2026-05-15");
        const canceled = cancelRecurringTransaction(rule, today);
        expect(canceled.endDate).toEqual(today);
      });

      it("does not mutate the original rule", () => {
        const today = new Date("2026-05-15");
        cancelRecurringTransaction(rule, today);
        expect(rule.endDate).toBeNull();
      });

      it("preserves all other fields", () => {
        const today = new Date("2026-05-15");
        const canceled = cancelRecurringTransaction(rule, today);
        expect(canceled.id).toBe(rule.id);
        expect(canceled.amount).toBe(rule.amount);
        expect(canceled.personId).toBe(rule.personId);
      });
    });

    describe("updateRecurringTransaction", () => {
      const rule: RecurringTransactionRecord = {
        id: "rule-1",
        personId: "person-1",
        type: "EXPENSE",
        amount: 500,
        description: "Rent",
        paymentMethod: "PIX",
        categoryId: null,
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const today = new Date("2026-05-15");
      const newId = "rule-2";

      it("returns a tuple of two rules", () => {
        const result = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(result).toHaveLength(2);
      });

      it("first rule (closed) has endDate set to today", () => {
        const [closed] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(closed.endDate).toEqual(today);
        expect(closed.id).toBe("rule-1");
      });

      it("second rule (new) has startDate set to today", () => {
        const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(newRule.startDate).toEqual(today);
      });

      it("second rule has the provided new id", () => {
        const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(newRule.id).toBe("rule-2");
      });

      it("second rule has the updated amount", () => {
        const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(newRule.amount).toBe(600);
      });

      it("second rule has null endDate (indefinite)", () => {
        const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(newRule.endDate).toBeNull();
      });

      it("does not mutate the original rule", () => {
        updateRecurringTransaction(rule, { amount: 600 }, newId, today);
        expect(rule.amount).toBe(500);
        expect(rule.endDate).toBeNull();
      });
    });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: FAIL — "cancelRecurringTransaction is not a function"

- [ ] **Step 3: Add cancel and update functions to the service**

Append to `src/domain/services/RecurringTransaction.ts`:

```typescript
export function cancelRecurringTransaction(
  rule: RecurringTransactionRecord,
  today: Date,
): RecurringTransactionRecord {
  return { ...rule, endDate: today, updatedAt: new Date() };
}

type UpdateableFields = Partial<
  Pick<
    RecurringTransactionRecord,
    "amount" | "description" | "categoryId" | "paymentMethod" | "frequency"
  >
>;

export function updateRecurringTransaction(
  rule: RecurringTransactionRecord,
  updates: UpdateableFields,
  newId: string,
  today: Date,
): [RecurringTransactionRecord, RecurringTransactionRecord] {
  const closedRule: RecurringTransactionRecord = {
    ...rule,
    endDate: today,
    updatedAt: new Date(),
  };

  const newRule: RecurringTransactionRecord = {
    ...rule,
    ...updates,
    id: newId,
    startDate: today,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return [closedRule, newRule];
}
```

- [ ] **Step 4: Run all service tests to verify they pass**

```bash
rtk jest tests/domain/services/RecurringTransaction.test.ts
```

Expected: PASS (37 tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/RecurringTransaction.ts \
        tests/domain/services/RecurringTransaction.test.ts
git commit -m "feat(domain): add cancelRecurringTransaction and updateRecurringTransaction"
```

---

## Task 6: Update MonthlyView — recurring occurrences in output

**Files:**
- Modify: `src/domain/services/MonthlyView.ts`
- Modify: `tests/domain/services/MonthlyView.test.ts`

- [ ] **Step 1: Add failing tests for recurring occurrences in monthly view**

Add to the imports at the top of `tests/domain/services/MonthlyView.test.ts`:

```typescript
import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";
```

Add a helper after `makeInstallment`:

```typescript
const makeRecurringRule = (
  overrides: Partial<RecurringTransactionRecord> = {},
): RecurringTransactionRecord => ({
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

Add inside `describe("buildMonthlyView", () => {`:

```typescript
    it("includes a recurring occurrence for an active rule in the target month", () => {
      const rule = makeRecurringRule();
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].id).toBe("rule-1");
      expect(view.transactions[0].amount).toBe(500);
    });

    it("excludes a recurring rule that starts after the target month", () => {
      const rule = makeRecurringRule({ startDate: new Date("2026-06-01") });
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(0);
    });

    it("excludes a recurring rule canceled in the target month", () => {
      const rule = makeRecurringRule({ endDate: new Date("2026-05-10") });
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(0);
    });

    it("filters recurring occurrences by personId when provided", () => {
      const rules = [
        makeRecurringRule({ id: "r1", personId: "person-1" }),
        makeRecurringRule({ id: "r2", personId: "person-2" }),
      ];
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: rules,
        year: 2026,
        month: 5,
        personId: "person-1",
      });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].id).toBe("r1");
    });

    it("merges recurring occurrences with regular transactions", () => {
      const txn = makeTransaction({ id: "txn-1" });
      const rule = makeRecurringRule({ id: "rule-1" });
      const view = buildMonthlyView({
        transactions: [txn],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(2);
      const ids = view.transactions.map((t) => t.id);
      expect(ids).toContain("txn-1");
      expect(ids).toContain("rule-1");
    });

    it("existing tests still pass when recurringRules is omitted", () => {
      const txn = makeTransaction({ id: "txn-1", date: new Date("2026-05-10") });
      const view = buildMonthlyView({
        transactions: [txn],
        installments: [],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(1);
    });
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
rtk jest tests/domain/services/MonthlyView.test.ts
```

Expected: FAIL — some tests fail due to unknown `recurringRules` property

- [ ] **Step 3: Update MonthlyView.ts**

Replace the entire file:

```typescript
// src/domain/services/MonthlyView.ts
import { generateOccurrence, isActiveInMonth } from "./RecurringTransaction";
import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";
import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type MonthlyViewInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  recurringRules?: RecurringTransactionRecord[];
  year: number;
  month: number;
  personId?: string;
};

type MonthlyViewResult = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
};

export function buildMonthlyView(input: MonthlyViewInput): MonthlyViewResult {
  const { transactions, installments, recurringRules = [], year, month, personId } = input;

  const matchesMonth = (date: Date) => {
    const d = new Date(date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  };

  const filteredTransactions = transactions
    .filter((t) => matchesMonth(t.date))
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments.filter(
    (i) => i.dueYear === year && i.dueMonth === month && !i.isCanceled,
  );

  const activeRules = recurringRules.filter(
    (r) =>
      isActiveInMonth(r, year, month) && (personId ? r.personId === personId : true),
  );

  const occurrences = activeRules.map((r) => generateOccurrence(r, year, month));

  return {
    transactions: [...filteredTransactions, ...occurrences],
    installments: filteredInstallments,
  };
}
```

- [ ] **Step 4: Run all MonthlyView tests to verify they pass**

```bash
rtk jest tests/domain/services/MonthlyView.test.ts
```

Expected: PASS (all existing + 6 new tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/MonthlyView.ts \
        tests/domain/services/MonthlyView.test.ts
git commit -m "feat(domain): merge recurring occurrences into monthly view output"
```

---

## Task 7: Update GetMonthlyViewUseCase

**Files:**
- Modify: `src/application/use-cases/GetMonthlyViewUseCase.ts`

No new tests needed (no existing test file for this use case; it will be covered when use case tests are added in Tasks 8–10 for the new use cases).

- [ ] **Step 1: Update the use case to accept and use recurringRepo**

Replace the entire file:

```typescript
// src/application/use-cases/GetMonthlyViewUseCase.ts
import type {
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { IRecurringTransactionRepository } from "../../domain/repositories/IRecurringTransactionRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { buildMonthlyView } from "../../domain/services/MonthlyView";

type Input = {
  year: number;
  month: number;
  personId?: string;
};

type Output = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
};

export async function getMonthlyViewUseCase(
  input: Input,
  transactionRepo: ITransactionRepository,
  creditCardRepo: ICreditCardPurchaseRepository,
  recurringRepo: IRecurringTransactionRepository,
): Promise<Output> {
  const { year, month, personId } = input;

  const [transactions, installments, recurringRules] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndMonth(personId, year, month)
      : transactionRepo.findByMonth(year, month),
    personId
      ? creditCardRepo.findInstallmentsByMonth(personId, year, month)
      : creditCardRepo.findAllInstallmentsByMonth(year, month),
    personId
      ? recurringRepo.findActiveByPersonAndMonth(personId, year, month)
      : recurringRepo.findAllActiveByMonth(year, month),
  ]);

  return buildMonthlyView({ transactions, installments, recurringRules, year, month, personId });
}
```

- [ ] **Step 2: Run full test suite to confirm nothing is broken**

```bash
rtk jest
```

Expected: PASS (all existing tests)

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/GetMonthlyViewUseCase.ts
git commit -m "feat(application): add recurringRepo to getMonthlyViewUseCase"
```

---

## Task 8: CreateRecurringTransactionUseCase — TDD

**Files:**
- Create: `src/application/use-cases/CreateRecurringTransactionUseCase.ts`
- Create: `tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts
import { createRecurringTransactionUseCase } from "../../../src/application/use-cases/CreateRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

const makeRepo = (
  overrides: Partial<IRecurringTransactionRepository> = {},
): IRecurringTransactionRepository => ({
  findById: async () => null,
  findActiveByPersonAndMonth: async () => [],
  findAllActiveByMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (id, changes) => ({ id, ...changes } as RecurringTransactionRecord),
  delete: async () => {},
  ...overrides,
});

const baseInput = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX" as const,
  categoryId: null,
  frequency: "MONTHLY" as const,
  startDate: new Date("2026-05-01"),
  endDate: null,
};

describe("CreateRecurringTransactionUseCase", () => {
  it("saves the rule via the repository and returns it", async () => {
    let saved: RecurringTransactionRecord | null = null;
    const repo = makeRepo({
      save: async (r) => {
        saved = { ...r, createdAt: new Date(), updatedAt: new Date() };
        return saved;
      },
    });

    const result = await createRecurringTransactionUseCase(baseInput, repo);

    expect(saved).not.toBeNull();
    expect(result.id).toBe("rule-1");
    expect(result.amount).toBe(500);
    expect(result.frequency).toBe("MONTHLY");
  });

  it("throws when personId is missing", async () => {
    const repo = makeRepo();

    await expect(
      createRecurringTransactionUseCase({ ...baseInput, personId: "" }, repo),
    ).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeRepo();

    await expect(
      createRecurringTransactionUseCase({ ...baseInput, amount: 0 }, repo),
    ).rejects.toThrow("Amount must be positive");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement the use case**

```typescript
// src/application/use-cases/CreateRecurringTransactionUseCase.ts
import type { IRecurringTransactionRepository, RecurringTransactionRecord } from "../../domain/repositories/IRecurringTransactionRepository";
import { createRecurringTransaction } from "../../domain/services/RecurringTransaction";

type Input = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: RecurringTransactionRecord["paymentMethod"];
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
};

export async function createRecurringTransactionUseCase(
  input: Input,
  repo: IRecurringTransactionRepository,
): Promise<RecurringTransactionRecord> {
  const rule = createRecurringTransaction(input);
  return repo.save(rule);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/CreateRecurringTransactionUseCase.ts \
        tests/application/use-cases/CreateRecurringTransactionUseCase.test.ts
git commit -m "feat(application): add CreateRecurringTransactionUseCase"
```

---

## Task 9: CancelRecurringTransactionUseCase — TDD

**Files:**
- Create: `src/application/use-cases/CancelRecurringTransactionUseCase.ts`
- Create: `tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts
import { cancelRecurringTransactionUseCase } from "../../../src/application/use-cases/CancelRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

const existingRule: RecurringTransactionRecord = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRepo = (
  overrides: Partial<IRecurringTransactionRepository> = {},
): IRecurringTransactionRepository => ({
  findById: async () => existingRule,
  findActiveByPersonAndMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (_id, changes) => ({ ...existingRule, ...changes }),
  delete: async () => {},
  ...overrides,
});

describe("CancelRecurringTransactionUseCase", () => {
  it("calls update with the rule id and endDate set to today", async () => {
    const today = new Date("2026-05-15");
    let updatedId: string | null = null;
    let updatedChanges: Partial<RecurringTransactionRecord> | null = null;

    const repo = makeRepo({
      update: async (id, changes) => {
        updatedId = id;
        updatedChanges = changes;
        return { ...existingRule, ...changes };
      },
    });

    await cancelRecurringTransactionUseCase("rule-1", today, repo);

    expect(updatedId).toBe("rule-1");
    expect(updatedChanges?.endDate).toEqual(today);
  });

  it("throws when rule is not found", async () => {
    const repo = makeRepo({ findById: async () => null });

    await expect(
      cancelRecurringTransactionUseCase("nonexistent", new Date(), repo),
    ).rejects.toThrow("Recurring transaction not found");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement the use case**

```typescript
// src/application/use-cases/CancelRecurringTransactionUseCase.ts
import type { IRecurringTransactionRepository } from "../../domain/repositories/IRecurringTransactionRepository";
import { cancelRecurringTransaction } from "../../domain/services/RecurringTransaction";

export async function cancelRecurringTransactionUseCase(
  id: string,
  today: Date,
  repo: IRecurringTransactionRepository,
): Promise<void> {
  const rule = await repo.findById(id);
  if (!rule) throw new Error("Recurring transaction not found");

  const canceled = cancelRecurringTransaction(rule, today);
  await repo.update(id, { endDate: canceled.endDate });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/CancelRecurringTransactionUseCase.ts \
        tests/application/use-cases/CancelRecurringTransactionUseCase.test.ts
git commit -m "feat(application): add CancelRecurringTransactionUseCase"
```

---

## Task 10: UpdateRecurringTransactionUseCase — TDD

**Files:**
- Create: `src/application/use-cases/UpdateRecurringTransactionUseCase.ts`
- Create: `tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts
import { updateRecurringTransactionUseCase } from "../../../src/application/use-cases/UpdateRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

const existingRule: RecurringTransactionRecord = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRepo = (
  overrides: Partial<IRecurringTransactionRepository> = {},
): IRecurringTransactionRepository => ({
  findById: async () => existingRule,
  findActiveByPersonAndMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (_id, changes) => ({ ...existingRule, ...changes }),
  delete: async () => {},
  ...overrides,
});

describe("UpdateRecurringTransactionUseCase", () => {
  it("closes the old rule with endDate=today", async () => {
    const today = new Date("2026-05-15");
    let closedId: string | null = null;
    let closedChanges: Partial<RecurringTransactionRecord> | null = null;

    const repo = makeRepo({
      update: async (id, changes) => {
        closedId = id;
        closedChanges = changes;
        return { ...existingRule, ...changes };
      },
    });

    await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, today },
      repo,
    );

    expect(closedId).toBe("rule-1");
    expect(closedChanges?.endDate).toEqual(today);
  });

  it("saves a new rule with updated values and startDate=today", async () => {
    const today = new Date("2026-05-15");
    let savedRule: RecurringTransactionRecord | null = null;

    const repo = makeRepo({
      save: async (r) => {
        savedRule = { ...r, createdAt: new Date(), updatedAt: new Date() };
        return savedRule;
      },
    });

    const result = await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, today },
      repo,
    );

    expect(savedRule).not.toBeNull();
    expect(result.id).toBe("rule-2");
    expect(result.amount).toBe(600);
    expect(result.startDate).toEqual(today);
    expect(result.endDate).toBeNull();
  });

  it("throws when rule is not found", async () => {
    const repo = makeRepo({ findById: async () => null });

    await expect(
      updateRecurringTransactionUseCase(
        { id: "nonexistent", newId: "rule-2", updates: { amount: 600 }, today: new Date() },
        repo,
      ),
    ).rejects.toThrow("Recurring transaction not found");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement the use case**

```typescript
// src/application/use-cases/UpdateRecurringTransactionUseCase.ts
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";
import { updateRecurringTransaction } from "../../domain/services/RecurringTransaction";

type UpdateableFields = Partial<
  Pick<RecurringTransactionRecord, "amount" | "description" | "categoryId" | "paymentMethod" | "frequency">
>;

type Input = {
  id: string;
  newId: string;
  updates: UpdateableFields;
  today: Date;
};

export async function updateRecurringTransactionUseCase(
  input: Input,
  repo: IRecurringTransactionRepository,
): Promise<RecurringTransactionRecord> {
  const { id, newId, updates, today } = input;

  const rule = await repo.findById(id);
  if (!rule) throw new Error("Recurring transaction not found");

  const [closedRule, newRule] = updateRecurringTransaction(rule, updates, newId, today);

  await repo.update(closedRule.id, { endDate: closedRule.endDate });
  return repo.save(newRule);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Run the full test suite to confirm all tests pass**

```bash
rtk jest
```

Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/application/use-cases/UpdateRecurringTransactionUseCase.ts \
        tests/application/use-cases/UpdateRecurringTransactionUseCase.test.ts
git commit -m "feat(application): add UpdateRecurringTransactionUseCase with split-rule pattern"
```
