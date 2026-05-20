# API Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Next.js App Router API routes for People, Categories, Expenses, Installments, Recurring Transactions, and Monthly View — no business logic in routes, only input parsing, use-case delegation, and response mapping.

**Architecture:** Routes live in `src/app/api/` following Next.js 14 App Router conventions. Each route instantiates Prisma repositories via a shared factory and delegates to existing application use cases. New use cases and Prisma repository implementations are added as prerequisites before routes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 7 (PostgreSQL), Jest + ts-jest.

---

## Schema Gaps (prerequisites)

Two domain interfaces reference fields that don't exist in the Prisma schema:
- `InstallmentRecord.isCanceled` — missing from `Installment` table
- `RecurringTransactionRecord.frequency` — missing from `RecurringTransaction` table

These must be migrated before the Prisma repositories can be implemented.

---

## File Structure

### New Migrations
- `src/infrastructure/database/schema.prisma` — add `isCanceled`, `FrequencyType` enum, `frequency`
- `src/infrastructure/database/migrations/<timestamp>_add_installment_canceled_recurring_frequency/migration.sql`

### New Infrastructure Repositories
- `src/infrastructure/repositories/PrismaPersonRepository.ts`
- `src/infrastructure/repositories/PrismaTransactionRepository.ts`
- `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`
- `src/infrastructure/repositories/PrismaRecurringTransactionRepository.ts`

### New Application Use Cases
- `src/application/use-cases/ListCategoriesUseCase.ts`
- `src/application/use-cases/CreateCategoryUseCase.ts`
- `src/application/use-cases/DeleteCategoryUseCase.ts`
- `src/application/use-cases/DeletePersonUseCase.ts`
- `src/application/use-cases/DeleteTransactionUseCase.ts`
- `src/application/use-cases/MarkInstallmentPaidUseCase.ts`

### New Application Tests
- `tests/application/use-cases/CreateCategoryUseCase.test.ts`
- `tests/application/use-cases/DeletePersonUseCase.test.ts`

### Shared API Library
- `src/app/api/_lib/errorResponse.ts`
- `src/app/api/_lib/repositories.ts`

### API Routes
- `src/app/api/people/route.ts` — GET (list), POST (create)
- `src/app/api/people/[id]/route.ts` — DELETE
- `src/app/api/categories/route.ts` — GET (list), POST (create)
- `src/app/api/categories/[id]/route.ts` — DELETE
- `src/app/api/expenses/route.ts` — POST (create)
- `src/app/api/expenses/[id]/route.ts` — DELETE
- `src/app/api/installments/route.ts` — POST (create installment purchase)
- `src/app/api/installments/[id]/route.ts` — DELETE (cancel)
- `src/app/api/installments/[id]/paid/route.ts` — PATCH (mark paid)
- `src/app/api/recurring-transactions/route.ts` — POST (create)
- `src/app/api/recurring-transactions/[id]/route.ts` — PATCH (update), DELETE (cancel)
- `src/app/api/monthly-view/route.ts` — GET

---

## Task 1: Schema Migration — isCanceled + frequency

**Files:**
- Modify: `src/infrastructure/database/schema.prisma`
- Create: `src/infrastructure/database/migrations/<timestamp>_add_installment_canceled_recurring_frequency/migration.sql`

- [ ] **Step 1: Update schema.prisma**

Add `FrequencyType` enum and the two new columns:

```prisma
enum FrequencyType {
  MONTHLY
}

model Installment {
  id                   String  @id @default(uuid())
  creditCardPurchaseId String
  installmentNumber    Int
  amount               Decimal @db.Decimal(15, 2)
  dueYear              Int
  dueMonth             Int
  isPaid               Boolean @default(false)
  isCanceled           Boolean @default(false)

  creditCardPurchase CreditCardPurchase @relation(fields: [creditCardPurchaseId], references: [id], onDelete: Cascade)

  @@unique([creditCardPurchaseId, installmentNumber])
}

model RecurringTransaction {
  id            String          @id @default(uuid())
  personId      String
  type          TransactionType
  amount        Decimal         @db.Decimal(15, 2)
  description   String
  paymentMethod PaymentMethod
  categoryId    String?
  frequency     FrequencyType   @default(MONTHLY)
  startDate     DateTime
  endDate       DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  person   Person    @relation(fields: [personId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Create migration SQL file**

Create directory and file:
```
src/infrastructure/database/migrations/20260504000000_add_installment_canceled_recurring_frequency/migration.sql
```

Content:
```sql
-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('MONTHLY');

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN "isCanceled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN "frequency" "FrequencyType" NOT NULL DEFAULT 'MONTHLY';
```

- [ ] **Step 3: Apply migration**

```bash
npx prisma migrate deploy
```

Expected: migration applies without error and Prisma client regenerates.

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/database/schema.prisma src/infrastructure/database/migrations/
git commit -m "feat(db): add isCanceled to Installment and frequency to RecurringTransaction"
```

---

## Task 2: PrismaPersonRepository

**Files:**
- Create: `src/infrastructure/repositories/PrismaPersonRepository.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import type { PrismaClient } from "@prisma/client";
import type { IPersonRepository, PersonRecord } from "../../domain/repositories/IPersonRepository";

export class PrismaPersonRepository implements IPersonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<PersonRecord[]> {
    return this.prisma.person.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<PersonRecord | null> {
    return this.prisma.person.findUnique({ where: { id } });
  }

  async save(person: Omit<PersonRecord, "createdAt">): Promise<PersonRecord> {
    return this.prisma.person.upsert({
      where: { id: person.id },
      create: { id: person.id, name: person.name },
      update: { name: person.name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.person.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaPersonRepository.ts
git commit -m "feat(infra): add PrismaPersonRepository"
```

---

## Task 3: PrismaTransactionRepository

**Files:**
- Create: `src/infrastructure/repositories/PrismaTransactionRepository.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import type { PrismaClient } from "@prisma/client";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";

function toRecord(row: {
  id: string;
  personId: string;
  type: string;
  amount: { toNumber(): number } | number;
  date: Date;
  description: string;
  paymentMethod: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TransactionRecord {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as TransactionRecord["type"],
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    date: row.date,
    description: row.description,
    paymentMethod: row.paymentMethod as TransactionRecord["paymentMethod"],
    categoryId: row.categoryId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<TransactionRecord | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByMonth(year: number, month: number): Promise<TransactionRecord[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
    });
    return rows.map(toRecord);
  }

  async findByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<TransactionRecord[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { personId, date: { gte: start, lt: end } },
    });
    return rows.map(toRecord);
  }

  async save(
    transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<TransactionRecord> {
    const row = await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id,
        personId: transaction.personId,
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        categoryId: transaction.categoryId,
      },
      update: {
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        categoryId: transaction.categoryId,
      },
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaTransactionRepository.ts
git commit -m "feat(infra): add PrismaTransactionRepository"
```

---

## Task 4: PrismaCreditCardPurchaseRepository

**Files:**
- Create: `src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import type { PrismaClient } from "@prisma/client";
import type {
  CreditCardPurchaseRecord,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";

function purchaseToRecord(row: {
  id: string;
  personId: string;
  description: string;
  totalAmount: { toNumber(): number } | number;
  numberOfInstallments: number;
  purchaseDate: Date;
  categoryId: string | null;
  createdAt: Date;
}): CreditCardPurchaseRecord {
  return {
    id: row.id,
    personId: row.personId,
    description: row.description,
    totalAmount: typeof row.totalAmount === "number" ? row.totalAmount : row.totalAmount.toNumber(),
    numberOfInstallments: row.numberOfInstallments,
    purchaseDate: row.purchaseDate,
    categoryId: row.categoryId,
    createdAt: row.createdAt,
  };
}

function installmentToRecord(row: {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: { toNumber(): number } | number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
}): InstallmentRecord {
  return {
    id: row.id,
    creditCardPurchaseId: row.creditCardPurchaseId,
    installmentNumber: row.installmentNumber,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    dueYear: row.dueYear,
    dueMonth: row.dueMonth,
    isPaid: row.isPaid,
    isCanceled: row.isCanceled,
  };
}

export class PrismaCreditCardPurchaseRepository implements ICreditCardPurchaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord> {
    const result = await this.prisma.creditCardPurchase.create({
      data: {
        id: purchase.id,
        personId: purchase.personId,
        description: purchase.description,
        totalAmount: purchase.totalAmount,
        numberOfInstallments: purchase.numberOfInstallments,
        purchaseDate: purchase.purchaseDate,
        categoryId: purchase.categoryId,
        installments: {
          create: installments.map((i) => ({
            installmentNumber: i.installmentNumber,
            amount: i.amount,
            dueYear: i.dueYear,
            dueMonth: i.dueMonth,
            isPaid: i.isPaid,
            isCanceled: i.isCanceled,
          })),
        },
      },
    });
    return purchaseToRecord(result);
  }

  async findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month, creditCardPurchase: { personId } },
    });
    return rows.map(installmentToRecord);
  }

  async markInstallmentPaid(installmentId: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id: installmentId },
      data: { isPaid: true },
    });
  }

  async findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { creditCardPurchaseId: purchaseId },
    });
    return rows.map(installmentToRecord);
  }

  async updateInstallments(installments: InstallmentRecord[]): Promise<void> {
    await this.prisma.$transaction(
      installments.map((i) =>
        this.prisma.installment.update({
          where: { id: i.id },
          data: { isPaid: i.isPaid, isCanceled: i.isCanceled },
        }),
      ),
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaCreditCardPurchaseRepository.ts
git commit -m "feat(infra): add PrismaCreditCardPurchaseRepository"
```

---

## Task 5: PrismaRecurringTransactionRepository

**Files:**
- Create: `src/infrastructure/repositories/PrismaRecurringTransactionRepository.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import type { PrismaClient } from "@prisma/client";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";

function toRecord(row: {
  id: string;
  personId: string;
  type: string;
  amount: { toNumber(): number } | number;
  description: string;
  paymentMethod: string;
  categoryId: string | null;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RecurringTransactionRecord {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as RecurringTransactionRecord["type"],
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    description: row.description,
    paymentMethod: row.paymentMethod as RecurringTransactionRecord["paymentMethod"],
    categoryId: row.categoryId,
    frequency: row.frequency as "MONTHLY",
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaRecurringTransactionRepository implements IRecurringTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RecurringTransactionRecord | null> {
    const row = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findActiveByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<RecurringTransactionRecord[]> {
    const targetDate = new Date(Date.UTC(year, month - 1, 1));
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        personId,
        startDate: { lte: new Date(Date.UTC(year, month, 0)) },
        OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
      },
    });
    return rows.map(toRecord);
  }

  async findAllActiveByMonth(year: number, month: number): Promise<RecurringTransactionRecord[]> {
    const targetDate = new Date(Date.UTC(year, month - 1, 1));
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        startDate: { lte: new Date(Date.UTC(year, month, 0)) },
        OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
      },
    });
    return rows.map(toRecord);
  }

  async save(
    record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    const row = await this.prisma.recurringTransaction.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        personId: record.personId,
        type: record.type,
        amount: record.amount,
        description: record.description,
        paymentMethod: record.paymentMethod,
        categoryId: record.categoryId,
        frequency: record.frequency,
        startDate: record.startDate,
        endDate: record.endDate,
      },
      update: {
        type: record.type,
        amount: record.amount,
        description: record.description,
        paymentMethod: record.paymentMethod,
        categoryId: record.categoryId,
        frequency: record.frequency,
        startDate: record.startDate,
        endDate: record.endDate,
      },
    });
    return toRecord(row);
  }

  async update(
    id: string,
    changes: Partial<Pick<RecurringTransactionRecord, "endDate" | "amount" | "description" | "categoryId" | "paymentMethod" | "frequency">>,
  ): Promise<RecurringTransactionRecord> {
    const row = await this.prisma.recurringTransaction.update({
      where: { id },
      data: changes,
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaRecurringTransactionRepository.ts
git commit -m "feat(infra): add PrismaRecurringTransactionRepository"
```

---

## Task 6: Category Use Cases

**Files:**
- Create: `src/application/use-cases/ListCategoriesUseCase.ts`
- Create: `src/application/use-cases/CreateCategoryUseCase.ts`
- Create: `src/application/use-cases/DeleteCategoryUseCase.ts`
- Create: `tests/application/use-cases/CreateCategoryUseCase.test.ts`

- [ ] **Step 1: Write failing tests for CreateCategoryUseCase**

Create `tests/application/use-cases/CreateCategoryUseCase.test.ts`:

```typescript
import { createCategoryUseCase } from "../../../src/application/use-cases/CreateCategoryUseCase";
import type { ICategoryRepository, CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";

const makeRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

describe("createCategoryUseCase", () => {
  it("creates a root category when parentId is null", async () => {
    const repo = makeRepo();
    const result = await createCategoryUseCase(
      { id: "cat-1", name: "Food", parentId: null, householdId: "default" },
      repo,
    );
    expect(result.name).toBe("Food");
    expect(result.path).toBe("Food");
    expect(result.level).toBe(0);
  });

  it("creates a child category with correct path and level", async () => {
    const parent: CategoryRecord = {
      id: "cat-parent",
      name: "Food",
      parentId: null,
      path: "Food",
      level: 0,
      householdId: "default",
      createdAt: new Date(),
    };
    const repo = makeRepo([parent]);
    const result = await createCategoryUseCase(
      { id: "cat-child", name: "Restaurants", parentId: "cat-parent", householdId: "default" },
      repo,
    );
    expect(result.path).toBe("Food/Restaurants");
    expect(result.level).toBe(1);
  });

  it("throws when parentId does not exist", async () => {
    const repo = makeRepo([]);
    await expect(
      createCategoryUseCase(
        { id: "cat-1", name: "Child", parentId: "nonexistent", householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Parent category not found");
  });

  it("throws when name is empty", async () => {
    const repo = makeRepo();
    await expect(
      createCategoryUseCase(
        { id: "cat-1", name: "", parentId: null, householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Name is required");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
rtk jest tests/application/use-cases/CreateCategoryUseCase.test.ts
```

Expected: FAIL — `Cannot find module '.../CreateCategoryUseCase'`

- [ ] **Step 3: Write ListCategoriesUseCase**

Create `src/application/use-cases/ListCategoriesUseCase.ts`:

```typescript
import type { ICategoryRepository, CategoryRecord } from "../../domain/repositories/ICategoryRepository";

export async function listCategoriesUseCase(
  repo: ICategoryRepository,
): Promise<CategoryRecord[]> {
  return repo.findAll();
}
```

- [ ] **Step 4: Write CreateCategoryUseCase**

Create `src/application/use-cases/CreateCategoryUseCase.ts`:

```typescript
import { createCategory } from "../../domain/entities/Category";
import type { ICategoryRepository, CategoryRecord } from "../../domain/repositories/ICategoryRepository";

type Input = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
};

export async function createCategoryUseCase(
  input: Input,
  repo: ICategoryRepository,
): Promise<CategoryRecord> {
  let parent: { path: string; level: number } | null = null;

  if (input.parentId !== null) {
    const parentRecord = await repo.findById(input.parentId);
    if (!parentRecord) throw new Error("Parent category not found");
    parent = { path: parentRecord.path, level: parentRecord.level };
  }

  const category = createCategory({ ...input, parent });
  return repo.save(category);
}
```

- [ ] **Step 5: Write DeleteCategoryUseCase**

Create `src/application/use-cases/DeleteCategoryUseCase.ts`:

```typescript
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";

export async function deleteCategoryUseCase(
  id: string,
  repo: ICategoryRepository,
): Promise<void> {
  const category = await repo.findById(id);
  if (!category) throw new Error("Category not found");
  await repo.delete(id);
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
rtk jest tests/application/use-cases/CreateCategoryUseCase.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 7: Commit**

```bash
git add src/application/use-cases/ListCategoriesUseCase.ts \
        src/application/use-cases/CreateCategoryUseCase.ts \
        src/application/use-cases/DeleteCategoryUseCase.ts \
        tests/application/use-cases/CreateCategoryUseCase.test.ts
git commit -m "feat(application): add Category use cases (list, create, delete)"
```

---

## Task 7: Person Delete, Transaction Delete, Installment Mark Paid

**Files:**
- Create: `src/application/use-cases/DeletePersonUseCase.ts`
- Create: `src/application/use-cases/DeleteTransactionUseCase.ts`
- Create: `src/application/use-cases/MarkInstallmentPaidUseCase.ts`
- Create: `tests/application/use-cases/DeletePersonUseCase.test.ts`

- [ ] **Step 1: Write failing tests for DeletePersonUseCase**

Create `tests/application/use-cases/DeletePersonUseCase.test.ts`:

```typescript
import { deletePersonUseCase } from "../../../src/application/use-cases/DeletePersonUseCase";
import type { IPersonRepository, PersonRecord } from "../../../src/domain/repositories/IPersonRepository";

const makePerson = (id: string): PersonRecord => ({
  id,
  name: "Test",
  createdAt: new Date(),
});

const makeRepo = (
  people: PersonRecord[] = [],
  overrides: Partial<IPersonRepository> = {},
): IPersonRepository => ({
  findAll: async () => people,
  findById: async (id) => people.find((p) => p.id === id) ?? null,
  save: async (p) => ({ ...p, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

describe("deletePersonUseCase", () => {
  it("deletes person when found", async () => {
    const deleted: string[] = [];
    const repo = makeRepo([makePerson("p-1")], {
      delete: async (id) => { deleted.push(id); },
    });
    await deletePersonUseCase("p-1", repo);
    expect(deleted).toContain("p-1");
  });

  it("throws when person not found", async () => {
    const repo = makeRepo([]);
    await expect(deletePersonUseCase("nonexistent", repo)).rejects.toThrow("Person not found");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
rtk jest tests/application/use-cases/DeletePersonUseCase.test.ts
```

Expected: FAIL — `Cannot find module '.../DeletePersonUseCase'`

- [ ] **Step 3: Write DeletePersonUseCase**

Create `src/application/use-cases/DeletePersonUseCase.ts`:

```typescript
import type { IPersonRepository } from "../../domain/repositories/IPersonRepository";

export async function deletePersonUseCase(
  id: string,
  repo: IPersonRepository,
): Promise<void> {
  const person = await repo.findById(id);
  if (!person) throw new Error("Person not found");
  await repo.delete(id);
}
```

- [ ] **Step 4: Write DeleteTransactionUseCase**

Create `src/application/use-cases/DeleteTransactionUseCase.ts`:

```typescript
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";

export async function deleteTransactionUseCase(
  id: string,
  repo: ITransactionRepository,
): Promise<void> {
  const transaction = await repo.findById(id);
  if (!transaction) throw new Error("Transaction not found");
  await repo.delete(id);
}
```

- [ ] **Step 5: Write MarkInstallmentPaidUseCase**

Create `src/application/use-cases/MarkInstallmentPaidUseCase.ts`:

```typescript
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function markInstallmentPaidUseCase(
  installmentId: string,
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  await repo.markInstallmentPaid(installmentId);
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
rtk jest tests/application/use-cases/DeletePersonUseCase.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 7: Run all tests to confirm no regressions**

```bash
rtk jest
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/application/use-cases/DeletePersonUseCase.ts \
        src/application/use-cases/DeleteTransactionUseCase.ts \
        src/application/use-cases/MarkInstallmentPaidUseCase.ts \
        tests/application/use-cases/DeletePersonUseCase.test.ts
git commit -m "feat(application): add delete and mark-paid use cases"
```

---

## Task 8: Shared API Library

**Files:**
- Create: `src/app/api/_lib/errorResponse.ts`
- Create: `src/app/api/_lib/repositories.ts`

- [ ] **Step 1: Write errorResponse helper**

Create `src/app/api/_lib/errorResponse.ts`:

```typescript
export function errorResponse(error: unknown): Response {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

- [ ] **Step 2: Write repository factory**

Create `src/app/api/_lib/repositories.ts`:

```typescript
import { prisma } from "../../../infrastructure/database/client";
import { PrismaCategoryRepository } from "../../../infrastructure/repositories/PrismaCategoryRepository";
import { PrismaCreditCardPurchaseRepository } from "../../../infrastructure/repositories/PrismaCreditCardPurchaseRepository";
import { PrismaPersonRepository } from "../../../infrastructure/repositories/PrismaPersonRepository";
import { PrismaRecurringTransactionRepository } from "../../../infrastructure/repositories/PrismaRecurringTransactionRepository";
import { PrismaTransactionRepository } from "../../../infrastructure/repositories/PrismaTransactionRepository";

export function createRepositories() {
  return {
    person: new PrismaPersonRepository(prisma),
    category: new PrismaCategoryRepository(prisma),
    transaction: new PrismaTransactionRepository(prisma),
    creditCard: new PrismaCreditCardPurchaseRepository(prisma),
    recurring: new PrismaRecurringTransactionRepository(prisma),
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/_lib/
git commit -m "feat(api): add shared errorResponse helper and repository factory"
```

---

## Task 9: People API Routes

**Files:**
- Create: `src/app/api/people/route.ts`
- Create: `src/app/api/people/[id]/route.ts`

Response contract:
```
GET  /api/people        → 200 { people: PersonRecord[] }
POST /api/people        → 201 PersonRecord   body: { name: string }
DELETE /api/people/[id] → 204 (no body)
```

- [ ] **Step 1: Write GET + POST /api/people**

Create `src/app/api/people/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createPersonUseCase } from "../../../application/use-cases/CreatePersonUseCase";
import { listPeopleUseCase } from "../../../application/use-cases/ListPeopleUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { person } = createRepositories();
    const people = await listPeopleUseCase(person);
    return Response.json({ people });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    const { person } = createRepositories();
    const result = await createPersonUseCase(
      { id: crypto.randomUUID(), name: body.name },
      person,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Write DELETE /api/people/[id]**

Create `src/app/api/people/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { deletePersonUseCase } from "../../../../application/use-cases/DeletePersonUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { person } = createRepositories();
    await deletePersonUseCase(params.id, person);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/people/
git commit -m "feat(api): add People routes (GET, POST, DELETE)"
```

---

## Task 10: Categories API Routes

**Files:**
- Create: `src/app/api/categories/route.ts`
- Create: `src/app/api/categories/[id]/route.ts`

Response contract:
```
GET    /api/categories        → 200 { categories: CategoryRecord[] }
POST   /api/categories        → 201 CategoryRecord   body: { name: string, parentId?: string | null }
DELETE /api/categories/[id]   → 204
```

Note: `householdId` is always `"default"` (single-household system, no auth).

- [ ] **Step 1: Write GET + POST /api/categories**

Create `src/app/api/categories/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createCategoryUseCase } from "../../../application/use-cases/CreateCategoryUseCase";
import { listCategoriesUseCase } from "../../../application/use-cases/ListCategoriesUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { category } = createRepositories();
    const categories = await listCategoriesUseCase(category);
    return Response.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    const { category } = createRepositories();
    const result = await createCategoryUseCase(
      {
        id: crypto.randomUUID(),
        name: body.name,
        parentId: body.parentId ?? null,
        householdId: "default",
      },
      category,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Write DELETE /api/categories/[id]**

Create `src/app/api/categories/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { deleteCategoryUseCase } from "../../../../application/use-cases/DeleteCategoryUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { category } = createRepositories();
    await deleteCategoryUseCase(params.id, category);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/categories/
git commit -m "feat(api): add Categories routes (GET, POST, DELETE)"
```

---

## Task 11: Expenses API Routes

**Files:**
- Create: `src/app/api/expenses/route.ts`
- Create: `src/app/api/expenses/[id]/route.ts`

Response contract:
```
POST   /api/expenses        → 201 TransactionRecord
  body: { personId, amount, date, description, paymentMethod, categoryId? }
DELETE /api/expenses/[id]   → 204
```

Valid `paymentMethod` values: `CASH | DEBIT_CARD | CREDIT_CARD | PIX | BANK_TRANSFER | BOLETO`

- [ ] **Step 1: Write POST /api/expenses**

Create `src/app/api/expenses/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createExpenseUseCase } from "../../../application/use-cases/CreateExpenseUseCase";
import type { TransactionRecord } from "../../../domain/repositories/ITransactionRepository";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

const VALID_PAYMENT_METHODS: TransactionRecord["paymentMethod"][] = [
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "PIX",
  "BANK_TRANSFER",
  "BOLETO",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.amount !== "number") return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!body.date) return Response.json({ error: "date is required" }, { status: 400 });
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return Response.json({ error: "invalid paymentMethod" }, { status: 400 });
    }

    const { transaction, category } = createRepositories();
    const result = await createExpenseUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        amount: body.amount,
        date: new Date(body.date),
        description: body.description ?? "",
        paymentMethod: body.paymentMethod,
        categoryId: body.categoryId ?? null,
      },
      transaction,
      category,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Write DELETE /api/expenses/[id]**

Create `src/app/api/expenses/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { deleteTransactionUseCase } from "../../../../application/use-cases/DeleteTransactionUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { transaction } = createRepositories();
    await deleteTransactionUseCase(params.id, transaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/expenses/
git commit -m "feat(api): add Expenses routes (POST, DELETE)"
```

---

## Task 12: Installments API Routes

**Files:**
- Create: `src/app/api/installments/route.ts`
- Create: `src/app/api/installments/[id]/route.ts`
- Create: `src/app/api/installments/[id]/paid/route.ts`

Response contract:
```
POST   /api/installments              → 201 CreditCardPurchaseRecord
  body: { personId, totalAmount, numberOfInstallments, purchaseDate, description, categoryId? }
DELETE /api/installments/[id]         → 204  (cancels all installments for this purchase)
PATCH  /api/installments/[id]/paid    → 204  (marks one installment as paid; [id] = installmentId)
```

- [ ] **Step 1: Write POST /api/installments**

Create `src/app/api/installments/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createInstallmentPurchaseUseCase } from "../../../application/use-cases/CreateInstallmentPurchaseUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.totalAmount !== "number") return Response.json({ error: "totalAmount must be a number" }, { status: 400 });
    if (typeof body.numberOfInstallments !== "number" || body.numberOfInstallments < 1) {
      return Response.json({ error: "numberOfInstallments must be a positive integer" }, { status: 400 });
    }
    if (!body.purchaseDate) return Response.json({ error: "purchaseDate is required" }, { status: 400 });

    const { creditCard } = createRepositories();
    const result = await createInstallmentPurchaseUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        totalAmount: body.totalAmount,
        numberOfInstallments: body.numberOfInstallments,
        purchaseDate: new Date(body.purchaseDate),
        description: body.description ?? "",
        categoryId: body.categoryId ?? null,
      },
      creditCard,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Write DELETE /api/installments/[id] (cancel purchase)**

Create `src/app/api/installments/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { cancelInstallmentPurchaseUseCase } from "../../../../application/use-cases/CancelInstallmentPurchaseUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCard } = createRepositories();
    await cancelInstallmentPurchaseUseCase(params.id, creditCard);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Write PATCH /api/installments/[id]/paid**

Create `src/app/api/installments/[id]/paid/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { markInstallmentPaidUseCase } from "../../../../../application/use-cases/MarkInstallmentPaidUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCard } = createRepositories();
    await markInstallmentPaidUseCase(params.id, creditCard);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/installments/
git commit -m "feat(api): add Installments routes (POST, DELETE, PATCH paid)"
```

---

## Task 13: Recurring Transactions API Routes

**Files:**
- Create: `src/app/api/recurring-transactions/route.ts`
- Create: `src/app/api/recurring-transactions/[id]/route.ts`

Response contract:
```
POST   /api/recurring-transactions       → 201 RecurringTransactionRecord
  body: { personId, type, amount, description, paymentMethod, categoryId?, frequency, startDate, endDate? }
PATCH  /api/recurring-transactions/[id]  → 200 RecurringTransactionRecord
  body: { amount?, description?, categoryId?, paymentMethod?, frequency? }
DELETE /api/recurring-transactions/[id]  → 204 (cancel — sets endDate to today)
```

- [ ] **Step 1: Write POST /api/recurring-transactions**

Create `src/app/api/recurring-transactions/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createRecurringTransactionUseCase } from "../../../application/use-cases/CreateRecurringTransactionUseCase";
import type { RecurringTransactionRecord } from "../../../domain/repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../../../domain/repositories/ITransactionRepository";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

const VALID_TYPES: RecurringTransactionRecord["type"][] = ["INCOME", "EXPENSE"];
const VALID_PAYMENT_METHODS: TransactionRecord["paymentMethod"][] = [
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "PIX",
  "BANK_TRANSFER",
  "BOLETO",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (!VALID_TYPES.includes(body.type)) return Response.json({ error: "type must be INCOME or EXPENSE" }, { status: 400 });
    if (typeof body.amount !== "number") return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return Response.json({ error: "invalid paymentMethod" }, { status: 400 });
    }
    if (!body.startDate) return Response.json({ error: "startDate is required" }, { status: 400 });

    const { recurring } = createRepositories();
    const result = await createRecurringTransactionUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        type: body.type,
        amount: body.amount,
        description: body.description ?? "",
        paymentMethod: body.paymentMethod,
        categoryId: body.categoryId ?? null,
        frequency: "MONTHLY",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      recurring,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Write PATCH + DELETE /api/recurring-transactions/[id]**

Create `src/app/api/recurring-transactions/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { cancelRecurringTransactionUseCase } from "../../../../application/use-cases/CancelRecurringTransactionUseCase";
import { updateRecurringTransactionUseCase } from "../../../../application/use-cases/UpdateRecurringTransactionUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.description !== undefined) updates.description = body.description;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
    if (body.frequency !== undefined) updates.frequency = body.frequency;

    const { recurring } = createRepositories();
    const result = await updateRecurringTransactionUseCase(
      {
        id: params.id,
        newId: crypto.randomUUID(),
        updates,
        today: new Date(),
      },
      recurring,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { recurring } = createRepositories();
    await cancelRecurringTransactionUseCase(params.id, new Date(), recurring);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/recurring-transactions/
git commit -m "feat(api): add Recurring Transactions routes (POST, PATCH, DELETE)"
```

---

## Task 14: Monthly View API Route

**Files:**
- Create: `src/app/api/monthly-view/route.ts`

Response contract:
```
GET /api/monthly-view?year=2026&month=5              → 200 { transactions, installments }
GET /api/monthly-view?year=2026&month=5&personId=xyz → 200 { transactions, installments }
```

- [ ] **Step 1: Write GET /api/monthly-view**

Create `src/app/api/monthly-view/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { getMonthlyViewUseCase } from "../../../application/use-cases/GetMonthlyViewUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    if (!yearParam || !monthParam) {
      return Response.json({ error: "year and month query params are required" }, { status: 400 });
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return Response.json({ error: "year must be an integer and month must be 1-12" }, { status: 400 });
    }

    const personId = searchParams.get("personId") ?? undefined;

    const { transaction, creditCard, recurring } = createRepositories();
    const result = await getMonthlyViewUseCase(
      { year, month, personId },
      transaction,
      creditCard,
      recurring,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Run all tests to confirm no regressions**

```bash
rtk jest
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/monthly-view/
git commit -m "feat(api): add Monthly View route (GET)"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|---|---|
| People management | Task 9 (GET, POST, DELETE /api/people) |
| Transactions (expense) | Task 11 (POST, DELETE /api/expenses) |
| Categories | Task 10 (GET, POST, DELETE /api/categories) |
| Credit card installments | Task 12 (POST, DELETE, PATCH /api/installments) |
| Recurring transactions | Task 13 (POST, PATCH, DELETE /api/recurring-transactions) |
| Monthly view | Task 14 (GET /api/monthly-view) |
| No business logic in routes | All routes only parse input, call use cases, return response |
| Stable response contracts | Contracts documented per task |

### Schema gaps addressed

| Gap | Task |
|---|---|
| `Installment.isCanceled` missing | Task 1 (migration) |
| `RecurringTransaction.frequency` missing | Task 1 (migration) |

### Missing Prisma repositories addressed

| Repo | Task |
|---|---|
| PrismaPersonRepository | Task 2 |
| PrismaTransactionRepository | Task 3 |
| PrismaCreditCardPurchaseRepository | Task 4 |
| PrismaRecurringTransactionRepository | Task 5 |

### Missing use cases addressed

| Use Case | Task |
|---|---|
| listCategoriesUseCase | Task 6 |
| createCategoryUseCase | Task 6 |
| deleteCategoryUseCase | Task 6 |
| deletePersonUseCase | Task 7 |
| deleteTransactionUseCase | Task 7 |
| markInstallmentPaidUseCase | Task 7 |

### Potential issues

1. **`cancelInstallmentPurchaseUseCase` doesn't verify purchaseId exists.** The repo's `findByPurchaseId` returns `[]` if not found, so cancel silently does nothing. This is acceptable for now — the cancel is idempotent.
2. **`markInstallmentPaidUseCase` doesn't verify installmentId exists.** Prisma will throw `P2025 Record not found` on update. The `errorResponse` helper doesn't handle Prisma errors — it only handles `Error` instances. Prisma errors are `Error` subclasses, so they will propagate as 400 instead of 404. This is acceptable for the first iteration.
3. **All routes return 400 for domain validation errors** (e.g., "Amount must be positive"). This is correct — domain errors are client input errors.
