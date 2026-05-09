# Credit Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a CreditCard entity with closure-date-aware installment scheduling, a CRUD screen, and a credit card bill view grouped by card.

**Architecture:** CreditCard and CreditCardClosure live in domain; InstallmentPurchase service gains closure-aware due-month logic; new PrismaCreditCardRepository handles persistence; UI gets a /credit-cards page and an updated InstallmentForm.

**Tech Stack:** TypeScript, Next.js 14 App Router, Prisma ORM, PostgreSQL, Jest/ts-jest

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/domain/entities/CreditCard.ts` | `createCreditCard` factory + types |
| `src/domain/repositories/ICreditCardRepository.ts` | Repository interface |
| `src/application/use-cases/CreateCreditCardUseCase.ts` | Create card |
| `src/application/use-cases/UpdateCreditCardUseCase.ts` | Update card |
| `src/application/use-cases/DeleteCreditCardUseCase.ts` | Delete card (blocked if purchases) |
| `src/application/use-cases/ListCreditCardsUseCase.ts` | List all cards |
| `src/application/use-cases/SetCreditCardClosureUseCase.ts` | Set closure date for a month |
| `src/application/use-cases/GetCreditCardBillUseCase.ts` | Bill view grouped by card |
| `src/infrastructure/repositories/PrismaCreditCardRepository.ts` | Prisma impl |
| `src/app/api/credit-cards/route.ts` | GET list, POST create |
| `src/app/api/credit-cards/[id]/route.ts` | PUT update, DELETE |
| `src/app/api/credit-cards/[id]/closures/route.ts` | POST set closure |
| `src/app/api/credit-cards/bill/route.ts` | GET bill view |
| `src/app/credit-cards/page.tsx` | Credit cards page |
| `src/components/credit-cards/CreditCardList.tsx` | List + delete |
| `src/components/credit-cards/CreditCardForm.tsx` | Create/edit form |
| `src/components/credit-cards/ClosureManager.tsx` | Variable card closures per month |
| `src/components/credit-cards/BillView.tsx` | Monthly bill view grouped by card |
| `tests/domain/entities/CreditCard.test.ts` | Unit tests |
| `tests/application/use-cases/CreateCreditCardUseCase.test.ts` | Use case tests |
| `tests/application/use-cases/GetCreditCardBillUseCase.test.ts` | Bill use case tests |

### Modified files
| File | Change |
|---|---|
| `src/domain/services/InstallmentPurchase.ts` | Add closure-aware `resolveFirstDueMonth`, accept card info |
| `src/domain/repositories/ICreditCardPurchaseRepository.ts` | Add `creditCardId` to `CreditCardPurchaseRecord` |
| `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts` | Accept `creditCardId`, fetch card, resolve closure |
| `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts` | Pass `creditCardId` |
| `src/infrastructure/database/schema.prisma` | Add `CreditCard`, `CreditCardClosure`; add `creditCardId` to `CreditCardPurchase` |
| `src/app/api/_lib/repositories.ts` | Add `creditCardRepo` |
| `src/app/api/installments/route.ts` | Require `creditCardId` |
| `src/components/transactions/InstallmentForm.tsx` | Add credit card selector |
| `src/app/layout.tsx` | Add Credit Cards nav link |
| `tests/domain/services/InstallmentPurchase.test.ts` | Update tests for new closure-aware API |

---

## Task 1: CreditCard domain entity

**Files:**
- Create: `src/domain/entities/CreditCard.ts`
- Create: `tests/domain/entities/CreditCard.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/domain/entities/CreditCard.test.ts
import { createCreditCard } from "../../../src/domain/entities/CreditCard";

const baseFixed = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED" as const,
  fixedClosureDay: 25,
  dueDayOfMonth: 10,
  alwaysNextMonth: false,
};

const baseVariable = {
  id: "card-2",
  name: "Itaú",
  closureType: "VARIABLE" as const,
  fixedClosureDay: null,
  dueDayOfMonth: 5,
  alwaysNextMonth: false,
};

describe("createCreditCard", () => {
  it("creates a FIXED card with all fields", () => {
    const card = createCreditCard(baseFixed);
    expect(card.id).toBe("card-1");
    expect(card.name).toBe("Nubank");
    expect(card.closureType).toBe("FIXED");
    expect(card.fixedClosureDay).toBe(25);
    expect(card.dueDayOfMonth).toBe(10);
    expect(card.alwaysNextMonth).toBe(false);
  });

  it("creates a VARIABLE card with null fixedClosureDay", () => {
    const card = createCreditCard(baseVariable);
    expect(card.closureType).toBe("VARIABLE");
    expect(card.fixedClosureDay).toBeNull();
  });

  it("throws when name is empty", () => {
    expect(() => createCreditCard({ ...baseFixed, name: "" })).toThrow("Name is required");
  });

  it("throws when name is only whitespace", () => {
    expect(() => createCreditCard({ ...baseFixed, name: "   " })).toThrow("Name is required");
  });

  it("throws when FIXED card has no fixedClosureDay", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: null }),
    ).toThrow("fixedClosureDay is required for FIXED cards");
  });

  it("throws when VARIABLE card has fixedClosureDay set", () => {
    expect(() =>
      createCreditCard({ ...baseVariable, fixedClosureDay: 15 }),
    ).toThrow("fixedClosureDay must be null for VARIABLE cards");
  });

  it("throws when fixedClosureDay is below 1", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: 0 }),
    ).toThrow("fixedClosureDay must be between 1 and 31");
  });

  it("throws when fixedClosureDay is above 31", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: 32 }),
    ).toThrow("fixedClosureDay must be between 1 and 31");
  });

  it("throws when dueDayOfMonth is below 1", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, dueDayOfMonth: 0 }),
    ).toThrow("dueDayOfMonth must be between 1 and 31");
  });

  it("throws when dueDayOfMonth is above 31", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, dueDayOfMonth: 32 }),
    ).toThrow("dueDayOfMonth must be between 1 and 31");
  });

  it("alwaysNextMonth defaults to false when false", () => {
    const card = createCreditCard(baseFixed);
    expect(card.alwaysNextMonth).toBe(false);
  });

  it("creates card with alwaysNextMonth true", () => {
    const card = createCreditCard({ ...baseFixed, alwaysNextMonth: true });
    expect(card.alwaysNextMonth).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/domain/entities/CreditCard.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the entity**

```typescript
// src/domain/entities/CreditCard.ts

export type ClosureType = "FIXED" | "VARIABLE";

export interface CreditCardRecord {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  createdAt: Date;
}

export interface CreditCardClosureRecord {
  id: string;
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
}

type CreateCreditCardInput = {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

export function createCreditCard(input: CreateCreditCardInput): CreditCardRecord {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  if (input.dueDayOfMonth < 1 || input.dueDayOfMonth > 31)
    throw new Error("dueDayOfMonth must be between 1 and 31");

  if (input.closureType === "FIXED") {
    if (input.fixedClosureDay === null || input.fixedClosureDay === undefined)
      throw new Error("fixedClosureDay is required for FIXED cards");
    if (input.fixedClosureDay < 1 || input.fixedClosureDay > 31)
      throw new Error("fixedClosureDay must be between 1 and 31");
  } else {
    if (input.fixedClosureDay !== null && input.fixedClosureDay !== undefined)
      throw new Error("fixedClosureDay must be null for VARIABLE cards");
  }

  return {
    id: input.id,
    name,
    closureType: input.closureType,
    fixedClosureDay: input.fixedClosureDay ?? null,
    dueDayOfMonth: input.dueDayOfMonth,
    alwaysNextMonth: input.alwaysNextMonth,
    createdAt: new Date(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
rtk jest tests/domain/entities/CreditCard.test.ts
```

Expected: PASS, all tests green

- [ ] **Step 5: Commit**

```bash
git add src/domain/entities/CreditCard.ts tests/domain/entities/CreditCard.test.ts
git commit -m "feat: add CreditCard domain entity with invariant validation"
```

---

## Task 2: ICreditCardRepository interface

**Files:**
- Create: `src/domain/repositories/ICreditCardRepository.ts`

- [ ] **Step 1: Create the interface**

```typescript
// src/domain/repositories/ICreditCardRepository.ts
import type { CreditCardClosureRecord, CreditCardRecord } from "../entities/CreditCard";

export interface ICreditCardRepository {
  save(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  update(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  findById(id: string): Promise<CreditCardRecord | null>;
  findAll(): Promise<CreditCardRecord[]>;
  delete(id: string): Promise<void>;
  hasPurchases(id: string): Promise<boolean>;
  setClosure(closure: Omit<CreditCardClosureRecord, "id">): Promise<CreditCardClosureRecord>;
  findClosure(creditCardId: string, year: number, month: number): Promise<CreditCardClosureRecord | null>;
  findClosuresByCard(creditCardId: string): Promise<CreditCardClosureRecord[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/repositories/ICreditCardRepository.ts
git commit -m "feat: add ICreditCardRepository interface"
```

---

## Task 3: Update InstallmentPurchase domain service (closure-aware scheduling)

**Files:**
- Modify: `src/domain/services/InstallmentPurchase.ts`
- Modify: `tests/domain/services/InstallmentPurchase.test.ts`

The current `createInstallments` always starts the first installment in the purchase month. We need to add a `resolveFirstDueMonth` helper and update `createInstallments` / `createInstallmentPurchase` to accept card closure info.

- [ ] **Step 1: Add new tests for closure-aware behavior**

Add these describe blocks at the end of `tests/domain/services/InstallmentPurchase.test.ts` (keep all existing tests — they will need small updates to pass the new required fields in Step 3):

```typescript
describe("resolveFirstDueMonth", () => {
  it("purchase before closure day goes to current month", () => {
    // day 10, closure 25 → same month
    const result = resolveFirstDueMonth({
      purchaseDay: 10,
      purchaseYear: 2026,
      purchaseMonth: 3,
      closureDay: 25,
      alwaysNextMonth: false,
    });
    expect(result).toEqual({ year: 2026, month: 3 });
  });

  it("purchase on closure day goes to next month", () => {
    // day 25 >= closure 25 → next month
    const result = resolveFirstDueMonth({
      purchaseDay: 25,
      purchaseYear: 2026,
      purchaseMonth: 3,
      closureDay: 25,
      alwaysNextMonth: false,
    });
    expect(result).toEqual({ year: 2026, month: 4 });
  });

  it("purchase after closure day goes to next month", () => {
    const result = resolveFirstDueMonth({
      purchaseDay: 28,
      purchaseYear: 2026,
      purchaseMonth: 3,
      closureDay: 25,
      alwaysNextMonth: false,
    });
    expect(result).toEqual({ year: 2026, month: 4 });
  });

  it("next month rolls over to January when purchase is in December", () => {
    const result = resolveFirstDueMonth({
      purchaseDay: 26,
      purchaseYear: 2026,
      purchaseMonth: 12,
      closureDay: 25,
      alwaysNextMonth: false,
    });
    expect(result).toEqual({ year: 2027, month: 1 });
  });

  it("alwaysNextMonth forces next month even when purchase is before closure", () => {
    const result = resolveFirstDueMonth({
      purchaseDay: 5,
      purchaseYear: 2026,
      purchaseMonth: 3,
      closureDay: 25,
      alwaysNextMonth: true,
    });
    expect(result).toEqual({ year: 2026, month: 4 });
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts
```

Expected: FAIL — `resolveFirstDueMonth` not exported

- [ ] **Step 3: Update the domain service**

Replace `src/domain/services/InstallmentPurchase.ts` with:

```typescript
import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";

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
  creditCardId: string;
};

type ResolveFirstDueMonthInput = {
  purchaseDay: number;
  purchaseYear: number;
  purchaseMonth: number;
  closureDay: number;
  alwaysNextMonth: boolean;
};

export function resolveFirstDueMonth(input: ResolveFirstDueMonthInput): { year: number; month: number } {
  const shiftNext = input.alwaysNextMonth || input.purchaseDay >= input.closureDay;
  if (!shiftNext) return { year: input.purchaseYear, month: input.purchaseMonth };

  if (input.purchaseMonth === 12) return { year: input.purchaseYear + 1, month: 1 };
  return { year: input.purchaseYear, month: input.purchaseMonth + 1 };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

type CreateInstallmentsInput = {
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
  closureDay: number;
  alwaysNextMonth: boolean;
};

export function createInstallments(input: CreateInstallmentsInput): InstallmentDraft[] {
  if (!input.personId) throw new Error("Person is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments < 1) throw new Error("Number of installments must be at least 1");

  const baseAmount = Math.floor((input.totalAmount / input.numberOfInstallments) * 100) / 100;
  if (baseAmount <= 0) throw new Error("Amount too small for the number of installments");

  const purchaseDay = input.purchaseDate.getUTCDate();
  const purchaseYear = input.purchaseDate.getUTCFullYear();
  const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;

  const first = resolveFirstDueMonth({
    purchaseDay,
    purchaseYear,
    purchaseMonth,
    closureDay: input.closureDay,
    alwaysNextMonth: input.alwaysNextMonth,
  });

  // Convert first due to absolute month index for arithmetic
  const firstAbsolute = (first.year - 1) * 12 + (first.month - 1);

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12) + 1;
    const dueMonth = (absolute % 12) + 1;

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

type CreateInstallmentPurchaseInput = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
  closureDay: number;
  alwaysNextMonth: boolean;
};

type InstallmentPurchaseResult = {
  purchase: PurchaseDraft;
  installments: InstallmentDraftWithPurchaseId[];
};

export function createInstallmentPurchase(
  input: CreateInstallmentPurchaseInput,
): InstallmentPurchaseResult {
  if (!input.personId) throw new Error("Person is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments <= 1)
    throw new Error("Number of installments must be greater than 1");

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
    creditCardId: input.creditCardId,
  };

  return { purchase, installments };
}

export function cancelInstallmentPurchase(
  installments: InstallmentRecord[],
): (InstallmentRecord & { isCanceled: true })[] {
  return installments.map((inst) => ({ ...inst, isCanceled: true as const }));
}
```

- [ ] **Step 4: Update existing tests to pass new required fields**

The existing `basePurchase` and `basePurchaseWithId` objects in `tests/domain/services/InstallmentPurchase.test.ts` must include `creditCardId`, `closureDay`, and `alwaysNextMonth`. Also add the import for `resolveFirstDueMonth`. Update the top of the test file:

```typescript
import {
  cancelInstallmentPurchase,
  createInstallmentPurchase,
  createInstallments,
  resolveFirstDueMonth,
} from "../../../src/domain/services/InstallmentPurchase";

const basePurchase = {
  personId: "person-1",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-01-15"),
  description: "TV",
  categoryId: null,
  creditCardId: "card-1",
  closureDay: 25,       // purchase day 15 < 25 → first installment = January (same month)
  alwaysNextMonth: false,
};
```

Also update the existing test `"first installment is due in the same month as the purchase"` — it still passes because day 15 < closure 25. All other timing tests remain valid.

Update `basePurchaseWithId`:
```typescript
const basePurchaseWithId = {
  id: "purchase-1",
  ...basePurchase,
};
```

And update the test `"each installment has due_month set correctly"`:
```typescript
it("each installment has due_month set correctly", () => {
  const result = createInstallmentPurchase({
    ...basePurchaseWithId,
    purchaseDate: new Date("2026-03-01"),  // day 1 < closure 25 → starts March
    numberOfInstallments: 3,
    totalAmount: 300,
  });

  expect(result.installments[0].dueMonth).toBe(3);
  expect(result.installments[1].dueMonth).toBe(4);
  expect(result.installments[2].dueMonth).toBe(5);
});
```

- [ ] **Step 5: Run all InstallmentPurchase tests**

```bash
rtk jest tests/domain/services/InstallmentPurchase.test.ts
```

Expected: PASS, all tests green

- [ ] **Step 6: Commit**

```bash
git add src/domain/services/InstallmentPurchase.ts tests/domain/services/InstallmentPurchase.test.ts
git commit -m "feat: add closure-aware installment scheduling to InstallmentPurchase service"
```

---

## Task 4: Prisma schema migration

**Files:**
- Modify: `src/infrastructure/database/schema.prisma`
- New migration generated by Prisma

- [ ] **Step 1: Update schema.prisma**

Add after the `Category` model and before `Transaction`:

```prisma
enum ClosureType {
  FIXED
  VARIABLE
}

model CreditCard {
  id               String      @id @default(uuid())
  name             String
  closureType      ClosureType
  fixedClosureDay  Int?
  dueDayOfMonth    Int
  alwaysNextMonth  Boolean     @default(false)
  createdAt        DateTime    @default(now())

  purchases CreditCardPurchase[]
  closures  CreditCardClosure[]
}

model CreditCardClosure {
  id           String     @id @default(uuid())
  creditCardId String
  year         Int
  month        Int
  closureDay   Int

  creditCard CreditCard @relation(fields: [creditCardId], references: [id], onDelete: Cascade)

  @@unique([creditCardId, year, month])
}
```

In the existing `CreditCardPurchase` model, add `creditCardId` field and relation:

```prisma
model CreditCardPurchase {
  id                   String   @id @default(uuid())
  personId             String
  creditCardId         String
  description          String
  totalAmount          Decimal  @db.Decimal(15, 2)
  numberOfInstallments Int
  purchaseDate         DateTime
  categoryId           String?
  createdAt            DateTime @default(now())

  person       Person        @relation(fields: [personId], references: [id], onDelete: Cascade)
  creditCard   CreditCard    @relation(fields: [creditCardId], references: [id])
  category     Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  installments Installment[]
}
```

- [ ] **Step 2: Run migration**

```bash
cd src/infrastructure/database && npx prisma migrate dev --name add_credit_card --schema schema.prisma
```

Expected: Migration created and applied, Prisma client regenerated

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/schema.prisma src/infrastructure/database/migrations/
git commit -m "feat: add CreditCard and CreditCardClosure to Prisma schema"
```

---

## Task 5: PrismaCreditCardRepository

**Files:**
- Create: `src/infrastructure/repositories/PrismaCreditCardRepository.ts`

- [ ] **Step 1: Implement the repository**

```typescript
// src/infrastructure/repositories/PrismaCreditCardRepository.ts
import type { PrismaClient } from "@prisma/client";
import type { CreditCardClosureRecord, CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

function toRecord(row: {
  id: string;
  name: string;
  closureType: string;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  createdAt: Date;
}): CreditCardRecord {
  return {
    id: row.id,
    name: row.name,
    closureType: row.closureType as CreditCardRecord["closureType"],
    fixedClosureDay: row.fixedClosureDay,
    dueDayOfMonth: row.dueDayOfMonth,
    alwaysNextMonth: row.alwaysNextMonth,
    createdAt: row.createdAt,
  };
}

function closureToRecord(row: {
  id: string;
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
}): CreditCardClosureRecord {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    year: row.year,
    month: row.month,
    closureDay: row.closureDay,
  };
}

export class PrismaCreditCardRepository implements ICreditCardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord> {
    const row = await this.prisma.creditCard.create({
      data: {
        id: card.id,
        name: card.name,
        closureType: card.closureType,
        fixedClosureDay: card.fixedClosureDay,
        dueDayOfMonth: card.dueDayOfMonth,
        alwaysNextMonth: card.alwaysNextMonth,
      },
    });
    return toRecord(row);
  }

  async update(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord> {
    const row = await this.prisma.creditCard.update({
      where: { id: card.id },
      data: {
        name: card.name,
        closureType: card.closureType,
        fixedClosureDay: card.fixedClosureDay,
        dueDayOfMonth: card.dueDayOfMonth,
        alwaysNextMonth: card.alwaysNextMonth,
      },
    });
    return toRecord(row);
  }

  async findById(id: string): Promise<CreditCardRecord | null> {
    const row = await this.prisma.creditCard.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findAll(): Promise<CreditCardRecord[]> {
    const rows = await this.prisma.creditCard.findMany({ orderBy: { name: "asc" } });
    return rows.map(toRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.creditCard.delete({ where: { id } });
  }

  async hasPurchases(id: string): Promise<boolean> {
    const count = await this.prisma.creditCardPurchase.count({ where: { creditCardId: id } });
    return count > 0;
  }

  async setClosure(closure: Omit<CreditCardClosureRecord, "id">): Promise<CreditCardClosureRecord> {
    const row = await this.prisma.creditCardClosure.upsert({
      where: {
        creditCardId_year_month: {
          creditCardId: closure.creditCardId,
          year: closure.year,
          month: closure.month,
        },
      },
      create: {
        id: crypto.randomUUID(),
        creditCardId: closure.creditCardId,
        year: closure.year,
        month: closure.month,
        closureDay: closure.closureDay,
      },
      update: { closureDay: closure.closureDay },
    });
    return closureToRecord(row);
  }

  async findClosure(
    creditCardId: string,
    year: number,
    month: number,
  ): Promise<CreditCardClosureRecord | null> {
    const row = await this.prisma.creditCardClosure.findUnique({
      where: { creditCardId_year_month: { creditCardId, year, month } },
    });
    return row ? closureToRecord(row) : null;
  }

  async findClosuresByCard(creditCardId: string): Promise<CreditCardClosureRecord[]> {
    const rows = await this.prisma.creditCardClosure.findMany({
      where: { creditCardId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return rows.map(closureToRecord);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaCreditCardRepository.ts
git commit -m "feat: add PrismaCreditCardRepository"
```

---

## Task 6: Update CreditCardPurchaseRecord and PrismaCreditCardPurchaseRepository

**Files:**
- Modify: `src/domain/repositories/ICreditCardPurchaseRepository.ts`
- Modify: `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`

- [ ] **Step 1: Add `creditCardId` to `CreditCardPurchaseRecord`**

In `src/domain/repositories/ICreditCardPurchaseRepository.ts`, add `creditCardId: string` to `CreditCardPurchaseRecord`:

```typescript
export interface CreditCardPurchaseRecord {
  id: string;
  personId: string;
  creditCardId: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  categoryId: string | null;
  createdAt: Date;
}
```

- [ ] **Step 2: Update `PrismaCreditCardPurchaseRepository`**

In `purchaseToRecord`, add `creditCardId: row.creditCardId` to the return object.

In `save`, add `creditCardId: purchase.creditCardId` to the `data` object inside `this.prisma.creditCardPurchase.create`.

- [ ] **Step 3: Run all tests**

```bash
rtk jest
```

Expected: PASS (type errors would surface here if any field is missing)

- [ ] **Step 4: Commit**

```bash
git add src/domain/repositories/ICreditCardPurchaseRepository.ts src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts
git commit -m "feat: add creditCardId to CreditCardPurchase domain and repository"
```

---

## Task 7: Application use cases — CreditCard CRUD

**Files:**
- Create: `src/application/use-cases/CreateCreditCardUseCase.ts`
- Create: `src/application/use-cases/UpdateCreditCardUseCase.ts`
- Create: `src/application/use-cases/DeleteCreditCardUseCase.ts`
- Create: `src/application/use-cases/ListCreditCardsUseCase.ts`
- Create: `tests/application/use-cases/CreateCreditCardUseCase.test.ts`

- [ ] **Step 1: Write tests for CreateCreditCardUseCase**

```typescript
// tests/application/use-cases/CreateCreditCardUseCase.test.ts
import { createCreditCardUseCase } from "../../../src/application/use-cases/CreateCreditCardUseCase";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";

function makeRepo(overrides: Partial<ICreditCardRepository> = {}): ICreditCardRepository {
  return {
    save: jest.fn().mockResolvedValue({ id: "card-1", name: "Nubank", closureType: "FIXED", fixedClosureDay: 25, dueDayOfMonth: 10, alwaysNextMonth: false, createdAt: new Date() } as CreditCardRecord),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
    setClosure: jest.fn(),
    findClosure: jest.fn(),
    findClosuresByCard: jest.fn(),
    ...overrides,
  };
}

describe("createCreditCardUseCase", () => {
  it("saves and returns the card", async () => {
    const repo = makeRepo();
    const result = await createCreditCardUseCase(
      { name: "Nubank", closureType: "FIXED", fixedClosureDay: 25, dueDayOfMonth: 10, alwaysNextMonth: false },
      repo,
    );
    expect(repo.save).toHaveBeenCalledOnce?.() ?? expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe("Nubank");
  });

  it("throws when domain validation fails", async () => {
    const repo = makeRepo();
    await expect(
      createCreditCardUseCase(
        { name: "", closureType: "FIXED", fixedClosureDay: 25, dueDayOfMonth: 10, alwaysNextMonth: false },
        repo,
      ),
    ).rejects.toThrow("Name is required");
    expect(repo.save).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/application/use-cases/CreateCreditCardUseCase.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement all four use cases**

```typescript
// src/application/use-cases/CreateCreditCardUseCase.ts
import { createCreditCard, type ClosureType, type CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

export async function createCreditCardUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardRecord> {
  const card = createCreditCard({ id: crypto.randomUUID(), ...input });
  return repo.save(card);
}
```

```typescript
// src/application/use-cases/UpdateCreditCardUseCase.ts
import { createCreditCard, type ClosureType, type CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

export async function updateCreditCardUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new Error("Credit card not found");
  const card = createCreditCard(input);
  return repo.update(card);
}
```

```typescript
// src/application/use-cases/DeleteCreditCardUseCase.ts
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

export async function deleteCreditCardUseCase(
  id: string,
  repo: ICreditCardRepository,
): Promise<void> {
  const hasPurchases = await repo.hasPurchases(id);
  if (hasPurchases) throw new Error("Cannot delete a card with existing purchases");
  await repo.delete(id);
}
```

```typescript
// src/application/use-cases/ListCreditCardsUseCase.ts
import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

export async function listCreditCardsUseCase(
  repo: ICreditCardRepository,
): Promise<CreditCardRecord[]> {
  return repo.findAll();
}
```

- [ ] **Step 4: Run tests**

```bash
rtk jest tests/application/use-cases/CreateCreditCardUseCase.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/CreateCreditCardUseCase.ts src/application/use-cases/UpdateCreditCardUseCase.ts src/application/use-cases/DeleteCreditCardUseCase.ts src/application/use-cases/ListCreditCardsUseCase.ts tests/application/use-cases/CreateCreditCardUseCase.test.ts
git commit -m "feat: add CreditCard CRUD use cases"
```

---

## Task 8: SetCreditCardClosureUseCase

**Files:**
- Create: `src/application/use-cases/SetCreditCardClosureUseCase.ts`

- [ ] **Step 1: Implement**

```typescript
// src/application/use-cases/SetCreditCardClosureUseCase.ts
import type { CreditCardClosureRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
};

export async function setCreditCardClosureUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardClosureRecord> {
  const card = await repo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");
  if (card.closureType !== "VARIABLE")
    throw new Error("Closure dates can only be set for VARIABLE cards");
  if (input.closureDay < 1 || input.closureDay > 31)
    throw new Error("closureDay must be between 1 and 31");
  return repo.setClosure(input);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/application/use-cases/SetCreditCardClosureUseCase.ts
git commit -m "feat: add SetCreditCardClosureUseCase"
```

---

## Task 9: Update CreateInstallmentPurchaseUseCase

**Files:**
- Modify: `src/application/use-cases/CreateInstallmentPurchaseUseCase.ts`

The use case must now accept `creditCardId`, fetch the card, resolve the closure day (from card or closure table), and pass all card info to the domain service.

- [ ] **Step 1: Update the use case**

```typescript
// src/application/use-cases/CreateInstallmentPurchaseUseCase.ts
import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
};

export async function createInstallmentPurchaseUseCase(
  input: Input,
  repo: ICreditCardPurchaseRepository,
  creditCardRepo: ICreditCardRepository,
) {
  const card = await creditCardRepo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");

  let closureDay: number;
  if (card.closureType === "FIXED") {
    closureDay = card.fixedClosureDay!;
  } else {
    const purchaseYear = input.purchaseDate.getUTCFullYear();
    const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;
    const closure = await creditCardRepo.findClosure(input.creditCardId, purchaseYear, purchaseMonth);
    if (!closure) {
      throw new Error(
        `No closure date set for ${card.name} in ${purchaseYear}-${String(purchaseMonth).padStart(2, "0")}. Set a closure date before registering purchases.`,
      );
    }
    closureDay = closure.closureDay;
  }

  const { purchase, installments } = createInstallmentPurchase({
    ...input,
    closureDay,
    alwaysNextMonth: card.alwaysNextMonth,
  });

  return repo.save(purchase, installments);
}
```

- [ ] **Step 2: Run all tests**

```bash
rtk jest
```

Expected: PASS — existing use case tests for `GetCreditCardPurchasesUseCase` unaffected; `CreateInstallmentPurchaseUseCase` is not tested separately yet.

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/CreateInstallmentPurchaseUseCase.ts
git commit -m "feat: update CreateInstallmentPurchaseUseCase to resolve card closure"
```

---

## Task 10: GetCreditCardBillUseCase

**Files:**
- Create: `src/application/use-cases/GetCreditCardBillUseCase.ts`
- Create: `tests/application/use-cases/GetCreditCardBillUseCase.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// tests/application/use-cases/GetCreditCardBillUseCase.test.ts
import { getCreditCardBillUseCase } from "../../../src/application/use-cases/GetCreditCardBillUseCase";
import type { ICreditCardRepository } from "../../../src/domain/repositories/ICreditCardRepository";
import type { ICreditCardPurchaseRepository } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

const card1 = { id: "card-1", name: "Nubank", closureType: "FIXED" as const, fixedClosureDay: 25, dueDayOfMonth: 10, alwaysNextMonth: false, createdAt: new Date() };
const card2 = { id: "card-2", name: "Itaú", closureType: "FIXED" as const, fixedClosureDay: 20, dueDayOfMonth: 5, alwaysNextMonth: false, createdAt: new Date() };

const installment1 = { id: "i-1", creditCardPurchaseId: "p-1", installmentNumber: 1, amount: 100, dueYear: 2026, dueMonth: 5, isPaid: false, isCanceled: false };
const installment2 = { id: "i-2", creditCardPurchaseId: "p-2", installmentNumber: 1, amount: 200, dueYear: 2026, dueMonth: 5, isPaid: false, isCanceled: false };

const purchase1 = { id: "p-1", personId: "person-1", creditCardId: "card-1", description: "TV", totalAmount: 1200, numberOfInstallments: 12, purchaseDate: new Date("2026-04-10"), categoryId: null, createdAt: new Date() };
const purchase2 = { id: "p-2", personId: "person-1", creditCardId: "card-2", description: "Phone", totalAmount: 200, numberOfInstallments: 2, purchaseDate: new Date("2026-04-10"), categoryId: null, createdAt: new Date() };

function makeCreditCardRepo(): ICreditCardRepository {
  return {
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([card1, card2]),
    delete: jest.fn(),
    hasPurchases: jest.fn(),
    setClosure: jest.fn(),
    findClosure: jest.fn(),
    findClosuresByCard: jest.fn(),
  };
}

function makePurchaseRepo(): ICreditCardPurchaseRepository {
  return {
    save: jest.fn(),
    findAllInstallmentsByMonth: jest.fn().mockResolvedValue([installment1, installment2]),
    findInstallmentsByMonth: jest.fn(),
    markInstallmentPaid: jest.fn(),
    findByPurchaseId: jest.fn(),
    updateInstallments: jest.fn(),
    findAllPurchasesWithInstallments: jest.fn().mockResolvedValue([purchase1, purchase2]),
  };
}

describe("getCreditCardBillUseCase", () => {
  it("groups installments by card for the given month", async () => {
    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      makePurchaseRepo(),
    );

    expect(result).toHaveLength(2);
    const nubank = result.find((r) => r.card.id === "card-1");
    expect(nubank).toBeDefined();
    expect(nubank!.installments).toHaveLength(1);
    expect(nubank!.installments[0].id).toBe("i-1");
  });

  it("includes card due date info", async () => {
    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      makePurchaseRepo(),
    );
    const nubank = result.find((r) => r.card.id === "card-1")!;
    expect(nubank.dueDayOfMonth).toBe(10);
  });

  it("excludes cards with no installments for the month", async () => {
    const purchaseRepo = makePurchaseRepo();
    (purchaseRepo.findAllInstallmentsByMonth as jest.Mock).mockResolvedValue([installment1]);
    (purchaseRepo.findAllPurchasesWithInstallments as jest.Mock).mockResolvedValue([purchase1]);

    const result = await getCreditCardBillUseCase(
      { year: 2026, month: 5 },
      makeCreditCardRepo(),
      purchaseRepo,
    );

    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe("card-1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
rtk jest tests/application/use-cases/GetCreditCardBillUseCase.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
// src/application/use-cases/GetCreditCardBillUseCase.ts
import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { ICreditCardPurchaseRepository, InstallmentRecord } from "../../domain/repositories/ICreditCardPurchaseRepository";

export type CreditCardBillEntry = {
  card: CreditCardRecord;
  dueDayOfMonth: number;
  installments: InstallmentRecord[];
  total: number;
};

type Input = { year: number; month: number };

export async function getCreditCardBillUseCase(
  input: Input,
  creditCardRepo: ICreditCardRepository,
  purchaseRepo: ICreditCardPurchaseRepository,
): Promise<CreditCardBillEntry[]> {
  const [installments, purchases, cards] = await Promise.all([
    purchaseRepo.findAllInstallmentsByMonth(input.year, input.month),
    purchaseRepo.findAllPurchasesWithInstallments(),
    creditCardRepo.findAll(),
  ]);

  // Map purchaseId → creditCardId
  const purchaseCardMap = new Map<string, string>(
    purchases.map((p) => [p.id, p.creditCardId]),
  );

  // Group installments by creditCardId (skip canceled)
  const byCard = new Map<string, InstallmentRecord[]>();
  for (const inst of installments) {
    if (inst.isCanceled) continue;
    const cardId = purchaseCardMap.get(inst.creditCardPurchaseId);
    if (!cardId) continue;
    const list = byCard.get(cardId) ?? [];
    list.push(inst);
    byCard.set(cardId, list);
  }

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const result: CreditCardBillEntry[] = [];
  for (const [cardId, insts] of byCard.entries()) {
    const card = cardMap.get(cardId);
    if (!card) continue;
    result.push({
      card,
      dueDayOfMonth: card.dueDayOfMonth,
      installments: insts,
      total: insts.reduce((sum, i) => sum + i.amount, 0),
    });
  }

  return result.sort((a, b) => a.card.name.localeCompare(b.card.name));
}
```

- [ ] **Step 4: Run tests**

```bash
rtk jest tests/application/use-cases/GetCreditCardBillUseCase.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/GetCreditCardBillUseCase.ts tests/application/use-cases/GetCreditCardBillUseCase.test.ts
git commit -m "feat: add GetCreditCardBillUseCase"
```

---

## Task 11: Update repositories factory and API routes factory

**Files:**
- Modify: `src/app/api/_lib/repositories.ts`

- [ ] **Step 1: Add creditCardRepo**

```typescript
// src/app/api/_lib/repositories.ts
import { prisma } from "../../../infrastructure/database/client";
import { PrismaCategoryRepository } from "../../../infrastructure/repositories/PrismaCategoryRepository";
import { PrismaCreditCardPurchaseRepository } from "../../../infrastructure/repositories/PrismaCreditCardPurchaseRepository";
import { PrismaCreditCardRepository } from "../../../infrastructure/repositories/PrismaCreditCardRepository";
import { PrismaPersonRepository } from "../../../infrastructure/repositories/PrismaPersonRepository";
import { PrismaRecurringTransactionRepository } from "../../../infrastructure/repositories/PrismaRecurringTransactionRepository";
import { PrismaTransactionRepository } from "../../../infrastructure/repositories/PrismaTransactionRepository";

export function createRepositories() {
  return {
    person: new PrismaPersonRepository(prisma),
    category: new PrismaCategoryRepository(prisma),
    transaction: new PrismaTransactionRepository(prisma),
    creditCard: new PrismaCreditCardPurchaseRepository(prisma),
    creditCardMeta: new PrismaCreditCardRepository(prisma),
    recurring: new PrismaRecurringTransactionRepository(prisma),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/_lib/repositories.ts
git commit -m "feat: add creditCardMeta repo to factory"
```

---

## Task 12: Credit card API routes (CRUD + closures)

**Files:**
- Create: `src/app/api/credit-cards/route.ts`
- Create: `src/app/api/credit-cards/[id]/route.ts`
- Create: `src/app/api/credit-cards/[id]/closures/route.ts`

- [ ] **Step 1: Create GET/POST route**

```typescript
// src/app/api/credit-cards/route.ts
import { NextRequest } from "next/server";
import { createCreditCardUseCase } from "../../../application/use-cases/CreateCreditCardUseCase";
import { listCreditCardsUseCase } from "../../../application/use-cases/ListCreditCardsUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { creditCardMeta } = createRepositories();
    const cards = await listCreditCardsUseCase(creditCardMeta);
    return Response.json({ cards });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return Response.json({ error: "name is required" }, { status: 400 });
    if (!body.closureType) return Response.json({ error: "closureType is required" }, { status: 400 });
    if (!body.dueDayOfMonth) return Response.json({ error: "dueDayOfMonth is required" }, { status: 400 });

    const { creditCardMeta } = createRepositories();
    const card = await createCreditCardUseCase(
      {
        name: body.name,
        closureType: body.closureType,
        fixedClosureDay: body.fixedClosureDay ?? null,
        dueDayOfMonth: body.dueDayOfMonth,
        alwaysNextMonth: body.alwaysNextMonth ?? false,
      },
      creditCardMeta,
    );
    return Response.json(card, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Create PUT/DELETE route**

```typescript
// src/app/api/credit-cards/[id]/route.ts
import { NextRequest } from "next/server";
import { updateCreditCardUseCase } from "../../../../application/use-cases/UpdateCreditCardUseCase";
import { deleteCreditCardUseCase } from "../../../../application/use-cases/DeleteCreditCardUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { creditCardMeta } = createRepositories();
    const card = await updateCreditCardUseCase(
      {
        id: params.id,
        name: body.name,
        closureType: body.closureType,
        fixedClosureDay: body.fixedClosureDay ?? null,
        dueDayOfMonth: body.dueDayOfMonth,
        alwaysNextMonth: body.alwaysNextMonth ?? false,
      },
      creditCardMeta,
    );
    return Response.json(card);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardMeta } = createRepositories();
    await deleteCreditCardUseCase(params.id, creditCardMeta);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Create closures route**

```typescript
// src/app/api/credit-cards/[id]/closures/route.ts
import { NextRequest } from "next/server";
import { setCreditCardClosureUseCase } from "../../../../../application/use-cases/SetCreditCardClosureUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.year || !body.month || !body.closureDay)
      return Response.json({ error: "year, month, and closureDay are required" }, { status: 400 });

    const { creditCardMeta } = createRepositories();
    const closure = await setCreditCardClosureUseCase(
      { creditCardId: params.id, year: body.year, month: body.month, closureDay: body.closureDay },
      creditCardMeta,
    );
    return Response.json(closure, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardMeta } = createRepositories();
    const closures = await creditCardMeta.findClosuresByCard(params.id);
    return Response.json({ closures });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/credit-cards/
git commit -m "feat: add credit card API routes"
```

---

## Task 13: Credit card bill API route

**Files:**
- Create: `src/app/api/credit-cards/bill/route.ts`

- [ ] **Step 1: Implement**

```typescript
// src/app/api/credit-cards/bill/route.ts
import { NextRequest } from "next/server";
import { getCreditCardBillUseCase } from "../../../../application/use-cases/GetCreditCardBillUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "");
    const month = parseInt(searchParams.get("month") ?? "");
    if (!year || !month)
      return Response.json({ error: "year and month are required" }, { status: 400 });

    const { creditCardMeta, creditCard } = createRepositories();
    const bill = await getCreditCardBillUseCase({ year, month }, creditCardMeta, creditCard);
    return Response.json({ bill });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/credit-cards/bill/route.ts
git commit -m "feat: add credit card bill API route"
```

---

## Task 14: Update installments API route

**Files:**
- Modify: `src/app/api/installments/route.ts`

- [ ] **Step 1: Add creditCardId requirement and pass creditCardRepo**

```typescript
// src/app/api/installments/route.ts
import { NextRequest } from "next/server";
import { createInstallmentPurchaseUseCase } from "../../../application/use-cases/CreateInstallmentPurchaseUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (!body.creditCardId) return Response.json({ error: "creditCardId is required" }, { status: 400 });
    if (typeof body.totalAmount !== "number") return Response.json({ error: "totalAmount must be a number" }, { status: 400 });
    if (typeof body.numberOfInstallments !== "number" || body.numberOfInstallments < 1)
      return Response.json({ error: "numberOfInstallments must be a positive integer" }, { status: 400 });
    if (!body.purchaseDate) return Response.json({ error: "purchaseDate is required" }, { status: 400 });

    const { creditCard, creditCardMeta } = createRepositories();
    const result = await createInstallmentPurchaseUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        creditCardId: body.creditCardId,
        totalAmount: body.totalAmount,
        numberOfInstallments: body.numberOfInstallments,
        purchaseDate: new Date(body.purchaseDate),
        description: body.description ?? "",
        categoryId: body.categoryId ?? null,
      },
      creditCard,
      creditCardMeta,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/installments/route.ts
git commit -m "feat: require creditCardId in installments API route"
```

---

## Task 15: Credit Cards UI page

**Files:**
- Create: `src/app/credit-cards/page.tsx`
- Create: `src/components/credit-cards/CreditCardList.tsx`
- Create: `src/components/credit-cards/CreditCardForm.tsx`
- Create: `src/components/credit-cards/ClosureManager.tsx`

- [ ] **Step 1: Create CreditCardForm component**

```typescript
// src/components/credit-cards/CreditCardForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

type Props = {
  card?: CreditCard;
  onSaved: () => void;
  onCancel: () => void;
};

export function CreditCardForm({ card, onSaved, onCancel }: Props) {
  const [name, setName] = useState(card?.name ?? "");
  const [closureType, setClosureType] = useState<"FIXED" | "VARIABLE">(card?.closureType ?? "FIXED");
  const [fixedClosureDay, setFixedClosureDay] = useState(String(card?.fixedClosureDay ?? ""));
  const [dueDayOfMonth, setDueDayOfMonth] = useState(String(card?.dueDayOfMonth ?? ""));
  const [alwaysNextMonth, setAlwaysNextMonth] = useState(card?.alwaysNextMonth ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = card ? `/api/credit-cards/${card.id}` : "/api/credit-cards";
    const method = card ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        closureType,
        fixedClosureDay: closureType === "FIXED" ? parseInt(fixedClosureDay, 10) : null,
        dueDayOfMonth: parseInt(dueDayOfMonth, 10),
        alwaysNextMonth,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save card.");
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-name">Card Name</Label>
        <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nubank" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-closure-type">Closure Type</Label>
        <Select id="cc-closure-type" value={closureType} onChange={(e) => setClosureType(e.target.value as "FIXED" | "VARIABLE")} required>
          <option value="FIXED">Fixed (same day every month)</option>
          <option value="VARIABLE">Variable (set per month)</option>
        </Select>
      </div>
      {closureType === "FIXED" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-closure-day">Closure Day</Label>
          <Input id="cc-closure-day" type="number" min="1" max="31" value={fixedClosureDay} onChange={(e) => setFixedClosureDay(e.target.value)} required />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-due-day">Due Day of Month</Label>
        <Input id="cc-due-day" type="number" min="1" max="31" value={dueDayOfMonth} onChange={(e) => setDueDayOfMonth(e.target.value)} required />
      </div>
      <div className="flex items-center gap-2">
        <input id="cc-always-next" type="checkbox" checked={alwaysNextMonth} onChange={(e) => setAlwaysNextMonth(e.target.checked)} />
        <Label htmlFor="cc-always-next">First installment always goes to next month</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : card ? "Update" : "Add Card"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Create ClosureManager component**

```typescript
// src/components/credit-cards/ClosureManager.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Closure = { id: string; year: number; month: number; closureDay: number };

export function ClosureManager({ cardId }: { cardId: string }) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [closureDay, setClosureDay] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/credit-cards/${cardId}/closures`);
    if (res.ok) {
      const data = await res.json();
      setClosures(data.closures);
    }
  }

  useEffect(() => { load(); }, [cardId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/credit-cards/${cardId}/closures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: parseInt(year, 10), month: parseInt(month, 10), closureDay: parseInt(closureDay, 10) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to set closure.");
      return;
    }
    setClosureDay("");
    load();
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm">Monthly Closure Dates</h3>
      {closures.length > 0 ? (
        <ul className="text-sm flex flex-col gap-1">
          {closures.map((c) => (
            <li key={c.id}>{c.year}-{String(c.month).padStart(2, "0")}: day {c.closureDay}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No closure dates set yet.</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-year">Year</Label>
          <Input id="cl-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-month">Month</Label>
          <Input id="cl-month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-20" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-day">Closure Day</Label>
          <Input id="cl-day" type="number" min="1" max="31" value={closureDay} onChange={(e) => setClosureDay(e.target.value)} className="w-20" required />
        </div>
        <Button type="submit">Set</Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create CreditCardList component**

```typescript
// src/components/credit-cards/CreditCardList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCardForm } from "./CreditCardForm";
import { ClosureManager } from "./ClosureManager";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

type Props = { initialCards: CreditCard[] };

export function CreditCardList({ initialCards }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [expandedClosures, setExpandedClosures] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/credit-cards");
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      return;
    }
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm && !editingCard && (
        <Button onClick={() => setShowForm(true)} className="self-start">Add Credit Card</Button>
      )}
      {showForm && (
        <Card className="p-4">
          <CreditCardForm onSaved={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
        </Card>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {cards.length === 0 && <p className="text-sm text-muted-foreground">No credit cards yet.</p>}
      {cards.map((card) => (
        <Card key={card.id} className="p-4 flex flex-col gap-3">
          {editingCard?.id === card.id ? (
            <CreditCardForm card={card} onSaved={() => { setEditingCard(null); refresh(); }} onCancel={() => setEditingCard(null)} />
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{card.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {card.closureType === "FIXED" ? `Closes day ${card.fixedClosureDay}` : "Variable closure"} · Due day {card.dueDayOfMonth}
                    {card.alwaysNextMonth ? " · Always next month" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {card.closureType === "VARIABLE" && (
                    <Button variant="outline" size="sm" onClick={() => setExpandedClosures(expandedClosures === card.id ? null : card.id)}>
                      Closures
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditingCard(card)}>Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(card.id)}>Delete</Button>
                </div>
              </div>
              {expandedClosures === card.id && <ClosureManager cardId={card.id} />}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create the page**

```typescript
// src/app/credit-cards/page.tsx
import { CreditCardList } from "@/components/credit-cards/CreditCardList";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getCards() {
  const res = await fetch(`${BASE_URL}/api/credit-cards`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards;
}

export default async function CreditCardsPage() {
  const cards = await getCards();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Credit Cards</h1>
      <CreditCardList initialCards={cards} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/credit-cards/ src/components/credit-cards/
git commit -m "feat: add credit cards UI page with CRUD and closure manager"
```

---

## Task 16: Update InstallmentForm to require credit card

**Files:**
- Modify: `src/components/transactions/InstallmentForm.tsx`

- [ ] **Step 1: Add credit card selector**

Update the component props type and add card selector field. Replace the existing `InstallmentForm` implementation:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };
type CreditCard = { id: string; name: string };

export function InstallmentForm({
  people,
  categories,
  creditCards,
}: {
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/installments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        creditCardId,
        totalAmount: parseFloat(totalAmount),
        numberOfInstallments: parseInt(numberOfInstallments, 10),
        purchaseDate,
        categoryId: categoryId || null,
        description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create installment purchase.");
      return;
    }

    setPersonId("");
    setCreditCardId("");
    setTotalAmount("");
    setNumberOfInstallments("2");
    setPurchaseDate(today);
    setCategoryId("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-person">Person</Label>
        <Select id="inst-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Select person</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-card">Credit Card</Label>
        <Select id="inst-card" value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} required>
          <option value="">Select card</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-total">Total Amount</Label>
        <Input id="inst-total" type="number" min="0.01" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-count">Number of Installments</Label>
        <Input id="inst-count" type="number" min="2" step="1" value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-date">Purchase Date</Label>
        <Input id="inst-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-category">Category</Label>
        <Select id="inst-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-description">Description</Label>
        <Input id="inst-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Adding…" : "Add Purchase"}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Update the page that renders InstallmentForm to pass creditCards**

In `src/app/transactions/page.tsx` (or wherever `InstallmentForm` is rendered), fetch credit cards and pass them. Find the component usage and add:

```typescript
async function getCreditCards() {
  const res = await fetch(`${BASE_URL}/api/credit-cards`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards;
}
```

Then pass `creditCards={creditCards}` to `<InstallmentForm>`.

- [ ] **Step 3: Commit**

```bash
git add src/components/transactions/InstallmentForm.tsx src/app/transactions/page.tsx
git commit -m "feat: add credit card selector to InstallmentForm"
```

---

## Task 17: Bill View UI

**Files:**
- Create: `src/components/credit-cards/BillView.tsx`
- Modify: `src/app/installments/page.tsx`

- [ ] **Step 1: Create BillView component**

```typescript
// src/components/credit-cards/BillView.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Installment = { id: string; installmentNumber: number; amount: number; isPaid: boolean };
type BillEntry = {
  card: { id: string; name: string };
  dueDayOfMonth: number;
  installments: Installment[];
  total: number;
};

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

export function BillView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bill, setBill] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(y: number, m: number) {
    setLoading(true);
    const res = await fetch(`/api/credit-cards/bill?year=${y}&month=${m}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    }
    setLoading(false);
  }

  useEffect(() => { load(year, month); }, [year, month]);

  function prev() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={prev}>←</Button>
        <span className="font-medium">{formatMonth(year, month)}</span>
        <Button variant="outline" size="sm" onClick={next}>→</Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && bill.length === 0 && (
        <p className="text-sm text-muted-foreground">No credit card installments for this month.</p>
      )}
      {bill.map((entry) => (
        <Card key={entry.card.id} className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{entry.card.name}</p>
              <p className="text-sm text-muted-foreground">Due: day {entry.dueDayOfMonth}</p>
            </div>
            <p className="font-semibold">R$ {entry.total.toFixed(2)}</p>
          </div>
          <ul className="text-sm flex flex-col gap-1">
            {entry.installments.map((inst) => (
              <li key={inst.id} className="flex justify-between">
                <span>Installment {inst.installmentNumber}{inst.isPaid ? " ✓" : ""}</span>
                <span>R$ {inst.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add bill view tab to installments page**

Update `src/app/installments/page.tsx` to add a tab switcher. Add a `view` search param (default `"purchases"`):

```typescript
// src/app/installments/page.tsx
import { InstallmentsList } from "@/components/installments/InstallmentsList";
import { BillView } from "@/components/credit-cards/BillView";

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

type SearchParams = { personId?: string; view?: string };

export default async function InstallmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const personId = searchParams.personId ?? "";
  const view = searchParams.view ?? "purchases";
  const [people, purchases] = await Promise.all([
    getPeople(),
    getPurchases(personId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Installments</h1>
      <div className="flex gap-2">
        <a href={`/installments?view=purchases${personId ? `&personId=${personId}` : ""}`}
          className={`px-3 py-1 rounded text-sm ${view === "purchases" ? "bg-foreground text-background" : "border"}`}>
          All Purchases
        </a>
        <a href={`/installments?view=bill`}
          className={`px-3 py-1 rounded text-sm ${view === "bill" ? "bg-foreground text-background" : "border"}`}>
          Bill View
        </a>
      </div>
      {view === "bill" ? (
        <BillView />
      ) : (
        <InstallmentsList people={people} purchases={purchases} currentPersonId={personId} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/credit-cards/BillView.tsx src/app/installments/page.tsx
git commit -m "feat: add credit card bill view to installments page"
```

---

## Task 18: Add Credit Cards to navigation

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add nav link**

In `src/app/layout.tsx`, find the navigation section and add a link for `/credit-cards`. Match the existing nav link pattern (look at how other links like `/installments` or `/categories` are rendered).

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Credit Cards link to navigation"
```

---

## Task 19: Run full test suite and verify

- [ ] **Step 1: Run all tests**

```bash
rtk jest
```

Expected: PASS — all tests green

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Verify:
1. `/credit-cards` page loads, can create FIXED and VARIABLE cards
2. VARIABLE card shows Closures button; can add monthly closure dates
3. `/transactions` installment form shows credit card selector
4. Creating an installment purchase: select FIXED card, pick date before closure → first installment in same month
5. Creating an installment purchase: select FIXED card, pick date on/after closure → first installment in next month
6. `/installments` Bill View tab shows installments grouped by card with totals
7. Delete card without purchases succeeds; delete card with purchases shows error
