# Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define and migrate the initial PostgreSQL database schema covering all entities described in SPEC.md (workspaces, members, transactions, credit card installments, recurring transactions, categories).

**Architecture:** Infrastructure layer only — the schema lives in `src/infrastructure/database/` and is exposed to the application layer via repository interfaces. The domain layer has zero Prisma imports. All ORM types are mapped to domain entities at the repository boundary.

**Tech Stack:** Next.js, PostgreSQL, **Prisma ORM** (see ORM decision below), TypeScript.

---

## ORM Decision: Prisma

**Chosen: Prisma over Drizzle.**

| Criterion | Prisma | Drizzle |
|---|---|---|
| Schema as source of truth | Yes — single `schema.prisma` file | Split across TS files |
| Migration tooling | `prisma migrate dev` — first-class | Manual or `drizzle-kit` |
| Enum support | Native | Native |
| Self-referential relations | Native syntax | Native |
| Team ramp-up | Easier (clear DSL) | Requires TS ORM knowledge |
| Type safety | Full | Full |

Prisma wins on migration safety and onboarding simplicity for this domain. Drizzle would be preferred only if query performance at scale became a concern (Prisma's query engine has overhead). At this stage, Prisma is the right call.

---

## Schema Design

### Entities

```
User
  └─ owns many Workspaces
  └─ is member of many Workspaces (via WorkspaceMember)

Workspace
  └─ has many WorkspaceMembers
  └─ has many Categories (hierarchical)
  └─ has many Transactions
  └─ has many CreditCardPurchases
  └─ has many RecurringTransactions

WorkspaceMember
  └─ User ↔ Workspace join with Role

Category
  └─ belongs to Workspace
  └─ optional parent Category (self-referential, unlimited depth)

Transaction
  └─ belongs to Workspace
  └─ optional Category
  └─ type: Income | Expense
  └─ paymentMethod: Cash | DebitCard | CreditCard | PIX | BankTransfer | Boleto

CreditCardPurchase
  └─ belongs to Workspace
  └─ has many Installments

Installment
  └─ belongs to CreditCardPurchase
  └─ targets a specific dueYear + dueMonth

RecurringTransaction
  └─ belongs to Workspace
  └─ optional Category
  └─ has startDate and optional endDate
```

---

## Proposed Prisma Schema

```prisma
// src/infrastructure/database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum Role {
  OWNER
  ADMIN
  MEMBER
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum PaymentMethod {
  CASH
  DEBIT_CARD
  CREDIT_CARD
  PIX
  BANK_TRANSFER
  BOLETO
}

// ─── Models ──────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ownedWorkspaces    Workspace[]       @relation("WorkspaceOwner")
  memberships        WorkspaceMember[] @relation("Member")
  invitedMemberships WorkspaceMember[] @relation("InvitedBy")
  createdTransactions Transaction[]
}

model Workspace {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner                 User                   @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members               WorkspaceMember[]
  categories            Category[]
  transactions          Transaction[]
  creditCardPurchases   CreditCardPurchase[]
  recurringTransactions RecurringTransaction[]
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        Role
  invitedById String?
  joinedAt    DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation("Member", fields: [userId], references: [id])
  invitedBy User?     @relation("InvitedBy", fields: [invitedById], references: [id])

  @@unique([workspaceId, userId])
}

model Category {
  id          String   @id @default(uuid())
  workspaceId String
  name        String
  parentId    String?
  createdAt   DateTime @default(now())

  workspace             Workspace              @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parent                Category?              @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children              Category[]             @relation("CategoryHierarchy")
  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]
}

model Transaction {
  id            String          @id @default(uuid())
  workspaceId   String
  type          TransactionType
  amount        Decimal         @db.Decimal(15, 2)
  date          DateTime
  description   String
  paymentMethod PaymentMethod
  categoryId    String?
  createdById   String
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  category  Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  createdBy User      @relation(fields: [createdById], references: [id])
}

model CreditCardPurchase {
  id                   String   @id @default(uuid())
  workspaceId          String
  description          String
  totalAmount          Decimal  @db.Decimal(15, 2)
  numberOfInstallments Int
  purchaseDate         DateTime
  categoryId           String?
  createdAt            DateTime @default(now())

  workspace    Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  installments Installment[]
}

model Installment {
  id                   String   @id @default(uuid())
  creditCardPurchaseId String
  installmentNumber    Int
  amount               Decimal  @db.Decimal(15, 2)
  dueYear              Int
  dueMonth             Int
  isPaid               Boolean  @default(false)

  creditCardPurchase CreditCardPurchase @relation(fields: [creditCardPurchaseId], references: [id], onDelete: Cascade)

  @@unique([creditCardPurchaseId, installmentNumber])
}

model RecurringTransaction {
  id            String          @id @default(uuid())
  workspaceId   String
  type          TransactionType
  amount        Decimal         @db.Decimal(15, 2)
  description   String
  paymentMethod PaymentMethod
  categoryId    String?
  startDate     DateTime
  endDate       DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  category  Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}
```

---

## File Structure

```
src/
  infrastructure/
    database/
      schema.prisma             ← Prisma schema (single source of truth)
      client.ts                 ← PrismaClient singleton
    repositories/
      user.repository.ts
      workspace.repository.ts
      transaction.repository.ts
      credit-card-purchase.repository.ts
      recurring-transaction.repository.ts
      category.repository.ts
    migrations/                 ← Auto-generated by prisma migrate dev
```

Domain interfaces live separately (no Prisma imports):

```
src/
  domain/
    repositories/
      IUserRepository.ts
      IWorkspaceRepository.ts
      ITransactionRepository.ts
      ICreditCardPurchaseRepository.ts
      IRecurringTransactionRepository.ts
      ICategoryRepository.ts
```

---

## Implementation Tasks

> **Do not start these until the schema proposal is approved.**

---

### Task 1: Install Prisma and initialize schema

**Files:**
- Create: `src/infrastructure/database/schema.prisma`
- Create: `src/infrastructure/database/client.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql --output src/infrastructure/database
```

- [ ] **Step 2: Replace generated schema with the approved schema**

Copy the full schema from the "Proposed Prisma Schema" section above into `src/infrastructure/database/schema.prisma`.

- [ ] **Step 3: Create PrismaClient singleton**

```typescript
// src/infrastructure/database/client.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Add DATABASE_URL to .env**

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/homeledger"
```

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/database/schema.prisma src/infrastructure/database/client.ts package.json package-lock.json .env.example
git commit -m "feat: add Prisma schema and client singleton"
```

---

### Task 2: Run initial migration

**Files:**
- Create: `src/infrastructure/database/migrations/` (auto-generated)

- [ ] **Step 1: Run the migration**

```bash
npx prisma migrate dev --name init --schema src/infrastructure/database/schema.prisma
```

Expected output:
```
✔ Generated Prisma Client (v5.x.x)
✔ Applied 1 migration
```

- [ ] **Step 2: Verify the generated SQL**

Open `src/infrastructure/database/migrations/<timestamp>_init/migration.sql` and confirm:
- All 8 tables are present: `User`, `Workspace`, `WorkspaceMember`, `Category`, `Transaction`, `CreditCardPurchase`, `Installment`, `RecurringTransaction`
- All enums are present: `Role`, `TransactionType`, `PaymentMethod`
- Unique constraint on `WorkspaceMember(workspaceId, userId)`
- Unique constraint on `Installment(creditCardPurchaseId, installmentNumber)`

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/migrations/
git commit -m "feat: apply initial database migration"
```

---

### Task 3: Define domain repository interfaces

**Files:**
- Create: `src/domain/repositories/IUserRepository.ts`
- Create: `src/domain/repositories/IWorkspaceRepository.ts`
- Create: `src/domain/repositories/ITransactionRepository.ts`
- Create: `src/domain/repositories/ICreditCardPurchaseRepository.ts`
- Create: `src/domain/repositories/IRecurringTransactionRepository.ts`
- Create: `src/domain/repositories/ICategoryRepository.ts`

- [ ] **Step 1: Write tests for interface compliance (compile-time)**

```typescript
// tests/domain/repositories/IUserRepository.test.ts
import type { IUserRepository } from "../../../src/domain/repositories/IUserRepository";

// This test exists to ensure the interface contract is explicit.
// A mock that satisfies the interface must implement all methods.
class MockUserRepository implements IUserRepository {
  async findById(id: string) { return null; }
  async findByEmail(email: string) { return null; }
  async save(user: { id: string; email: string; name: string; passwordHash: string }) { return user as any; }
}

describe("IUserRepository interface", () => {
  it("can be implemented by a class", () => {
    const repo = new MockUserRepository();
    expect(repo).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails (interface not yet defined)**

```bash
npx jest tests/domain/repositories/IUserRepository.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/domain/repositories/IUserRepository'`

- [ ] **Step 3: Define IUserRepository**

```typescript
// src/domain/repositories/IUserRepository.ts
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  save(user: Omit<UserRecord, "createdAt" | "updatedAt">): Promise<UserRecord>;
}
```

- [ ] **Step 4: Define IWorkspaceRepository**

```typescript
// src/domain/repositories/IWorkspaceRepository.ts
export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  invitedById: string | null;
  joinedAt: Date;
}

export interface IWorkspaceRepository {
  findById(id: string): Promise<WorkspaceRecord | null>;
  findByUserId(userId: string): Promise<WorkspaceRecord[]>;
  save(workspace: Omit<WorkspaceRecord, "createdAt" | "updatedAt">): Promise<WorkspaceRecord>;
  addMember(member: Omit<WorkspaceMemberRecord, "joinedAt">): Promise<WorkspaceMemberRecord>;
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord | null>;
}
```

- [ ] **Step 5: Define ITransactionRepository**

```typescript
// src/domain/repositories/ITransactionRepository.ts
export interface TransactionRecord {
  id: string;
  workspaceId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionRecord | null>;
  findByWorkspaceAndMonth(workspaceId: string, year: number, month: number): Promise<TransactionRecord[]>;
  save(transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 6: Define ICreditCardPurchaseRepository**

```typescript
// src/domain/repositories/ICreditCardPurchaseRepository.ts
export interface CreditCardPurchaseRecord {
  id: string;
  workspaceId: string;
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
}

export interface ICreditCardPurchaseRepository {
  save(purchase: Omit<CreditCardPurchaseRecord, "createdAt">, installments: Omit<InstallmentRecord, "id">[]): Promise<CreditCardPurchaseRecord>;
  findInstallmentsByMonth(workspaceId: string, year: number, month: number): Promise<InstallmentRecord[]>;
  markInstallmentPaid(installmentId: string): Promise<void>;
}
```

- [ ] **Step 7: Define IRecurringTransactionRepository**

```typescript
// src/domain/repositories/IRecurringTransactionRepository.ts
export interface RecurringTransactionRecord {
  id: string;
  workspaceId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringTransactionRepository {
  findActiveByWorkspaceAndMonth(workspaceId: string, year: number, month: number): Promise<RecurringTransactionRecord[]>;
  save(record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">): Promise<RecurringTransactionRecord>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 8: Define ICategoryRepository**

```typescript
// src/domain/repositories/ICategoryRepository.ts
export interface CategoryRecord {
  id: string;
  workspaceId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface ICategoryRepository {
  findByWorkspace(workspaceId: string): Promise<CategoryRecord[]>;
  findById(id: string): Promise<CategoryRecord | null>;
  save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
npx jest tests/domain/repositories/
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/domain/repositories/ tests/domain/repositories/
git commit -m "feat: define domain repository interfaces"
```

---

## Self-Review Checklist

### Spec Coverage

| SPEC.md Requirement | Covered by |
|---|---|
| User can own one or more workspaces | `Workspace.ownerId → User` |
| User invited to workspace by email | `WorkspaceMember.invitedById`, invite flow in application layer |
| Member roles: Owner, Admin, Member | `Role` enum, `WorkspaceMember.role` |
| Transaction: Income / Expense | `TransactionType` enum |
| Transaction belongs to workspace | `Transaction.workspaceId` |
| Transaction has amount, date, description, paymentMethod | All columns present |
| Transaction may belong to category | `Transaction.categoryId` nullable FK |
| Payment methods: Cash, Debit, Credit, PIX, BankTransfer, Boleto | `PaymentMethod` enum |
| Credit card: one or more installments | `CreditCardPurchase` + `Installment` |
| Original purchase stores total amount | `CreditCardPurchase.totalAmount` |
| Each installment affects a specific month | `Installment.dueYear + dueMonth` |
| Monthly view includes installments due that month | `findInstallmentsByMonth()` |
| Recurring transaction defines a rule | `RecurringTransaction` model |
| Recurring may have an end date or be indefinite | `RecurringTransaction.endDate` nullable |
| Categories are hierarchical | `Category.parentId` self-referential FK |
| All data belongs to a workspace | All entities have `workspaceId` |

All spec requirements are covered. No gaps found.
