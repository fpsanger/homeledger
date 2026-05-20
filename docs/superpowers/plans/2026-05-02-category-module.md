# Category Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Category domain module with hierarchical path/level management, circular-reference protection, deletion guards, and a Prisma repository — all driven by already-written failing tests.

**Architecture:** Category is a pure domain entity with path and level computed at creation time. A stateless `CategoryTree` service operates on in-memory `CategoryRecord[]` arrays for tree queries, circular-reference checks, and path cascades. The Prisma repository persists `path` and `level` directly so queries never need to recompute the hierarchy.

**Tech Stack:** TypeScript, Next.js 14, Prisma 7, PostgreSQL

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/domain/repositories/ICategoryRepository.ts` | Add `householdId`, `path`, `level` to `CategoryRecord` |
| Create | `src/domain/entities/Category.ts` | `createCategory()` — validates, computes path + level |
| Create | `src/domain/services/CategoryTree.ts` | Tree ops: circular check, delete guard, path cascade, tree builder, leaf/expense validation |
| Modify | `src/infrastructure/database/schema.prisma` | Add `path String` and `level Int` to `Category` model |
| Create | `src/infrastructure/repositories/PrismaCategoryRepository.ts` | Prisma implementation of `ICategoryRepository` |
| Modify | `CHANGELOG.md` | Document all changes |

---

### Task 1: Update `ICategoryRepository` type

**Files:**
- Modify: `src/domain/repositories/ICategoryRepository.ts`

The existing `CategoryRecord` is missing `householdId`, `path`, and `level`. The tests (and future entity/service) depend on these fields. This is a single-household system so `householdId` is always a constant in the infrastructure layer, but the domain type must include it.

- [ ] **Step 1: Replace `ICategoryRepository.ts` content**

```typescript
export interface CategoryRecord {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
  path: string;
  level: number;
  createdAt: Date;
}

export interface ICategoryRepository {
  findAll(): Promise<CategoryRecord[]>;
  findById(id: string): Promise<CategoryRecord | null>;
  save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 2: Verify existing contract test still passes**

```bash
npx jest tests/domain/repositories/ICategoryRepository.test.ts --no-coverage
```

Expected: `PASS` (the mock spreads `c` which satisfies the updated shape)

- [ ] **Step 3: Commit**

```bash
git add src/domain/repositories/ICategoryRepository.ts
git commit -m "feat(domain): extend CategoryRecord with householdId, path, level"
```

---

### Task 2: Implement `createCategory` entity

**Files:**
- Create: `src/domain/entities/Category.ts`
- Test: `tests/domain/entities/Category.test.ts` (already exists, currently failing)

The entity validates inputs and computes `path` and `level` from optional parent metadata. It does NOT call the repository — it only receives `parent?: { path, level }` inline.

- [ ] **Step 1: Run the failing test to confirm RED**

```bash
npx jest tests/domain/entities/Category.test.ts --no-coverage
```

Expected: `Cannot find module '../../../src/domain/entities/Category'`

- [ ] **Step 2: Create `src/domain/entities/Category.ts`**

```typescript
import type { CategoryRecord } from "../repositories/ICategoryRepository";

type CreateCategoryInput = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
  parent?: { path: string; level: number } | null;
};

export function createCategory(input: CreateCategoryInput): CategoryRecord {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Name is required");
  }

  if (!input.householdId) {
    throw new Error("Household is required");
  }

  const path = input.parent ? `${input.parent.path}/${name}` : name;
  const level = input.parent ? input.parent.level + 1 : 0;

  return {
    id: input.id,
    name,
    parentId: input.parentId,
    householdId: input.householdId,
    path,
    level,
    createdAt: new Date(),
  };
}
```

- [ ] **Step 3: Run tests to confirm GREEN**

```bash
npx jest tests/domain/entities/Category.test.ts --no-coverage
```

Expected: all tests PASS (14 tests)

- [ ] **Step 4: Commit**

```bash
git add src/domain/entities/Category.ts
git commit -m "feat(domain): implement createCategory entity with path and level computation"
```

---

### Task 3: Implement `CategoryTree` service

**Files:**
- Create: `src/domain/services/CategoryTree.ts`
- Test: `tests/domain/services/CategoryTree.test.ts` (already exists, currently failing)

This is a pure stateless service. Every function takes `CategoryRecord[]` and returns a value — no side effects, no I/O. The `computeUpdatedPaths` function returns a new array with updated records (does not mutate).

- [ ] **Step 1: Run the failing test to confirm RED**

```bash
npx jest tests/domain/services/CategoryTree.test.ts --no-coverage
```

Expected: `Cannot find module '../../../src/domain/services/CategoryTree'`

- [ ] **Step 2: Create `src/domain/services/CategoryTree.ts`**

```typescript
import type { CategoryRecord } from "../repositories/ICategoryRepository";

export type CategoryTreeNode = {
  category: CategoryRecord;
  children: CategoryTreeNode[];
};

export function isCircularReference(
  categoryId: string,
  newParentId: string,
  categories: CategoryRecord[]
): boolean {
  if (categoryId === newParentId) return true;

  // Walk the ancestor chain of newParentId upward.
  // If we encounter categoryId, moving categoryId there would create a cycle.
  const byId = new Map(categories.map((c) => [c.id, c]));
  let current = byId.get(newParentId);
  while (current) {
    if (current.id === categoryId) return true;
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }
  return false;
}

export function canDeleteCategory(
  categoryId: string,
  categories: CategoryRecord[]
): boolean {
  return !categories.some((c) => c.parentId === categoryId);
}

export function isLeafCategory(
  categoryId: string,
  categories: CategoryRecord[]
): boolean {
  return canDeleteCategory(categoryId, categories);
}

export function validateExpenseCategory(
  categoryId: string | null,
  categories: CategoryRecord[]
): void {
  if (categoryId === null) return;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Category not found");

  if (!isLeafCategory(categoryId, categories)) {
    throw new Error("Expense must use the most specific category");
  }
}

export function computeUpdatedPaths(
  categoryId: string,
  newParent: CategoryRecord | null,
  categories: CategoryRecord[]
): CategoryRecord[] {
  const target = categories.find((c) => c.id === categoryId);
  if (!target) return categories;

  const newPath = newParent ? `${newParent.path}/${target.name}` : target.name;
  const newLevel = newParent ? newParent.level + 1 : 0;

  const updatedTarget: CategoryRecord = {
    ...target,
    parentId: newParent?.id ?? null,
    path: newPath,
    level: newLevel,
  };

  const withUpdatedTarget = categories.map((c) =>
    c.id === categoryId ? updatedTarget : c
  );

  return cascadeDescendants(categoryId, updatedTarget, withUpdatedTarget);
}

function cascadeDescendants(
  parentId: string,
  updatedParent: CategoryRecord,
  categories: CategoryRecord[]
): CategoryRecord[] {
  const children = categories.filter((c) => c.parentId === parentId);
  let result = categories;

  for (const child of children) {
    const updatedChild: CategoryRecord = {
      ...child,
      path: `${updatedParent.path}/${child.name}`,
      level: updatedParent.level + 1,
    };
    result = result.map((c) => (c.id === child.id ? updatedChild : c));
    result = cascadeDescendants(child.id, updatedChild, result);
  }

  return result;
}

export function buildCategoryTree(categories: CategoryRecord[]): CategoryTreeNode[] {
  const roots = categories.filter((c) => c.parentId === null);
  return roots.map((root) => buildNode(root, categories));
}

function buildNode(
  category: CategoryRecord,
  all: CategoryRecord[]
): CategoryTreeNode {
  const children = all
    .filter((c) => c.parentId === category.id)
    .map((child) => buildNode(child, all));
  return { category, children };
}
```

- [ ] **Step 3: Run tests to confirm GREEN**

```bash
npx jest tests/domain/services/CategoryTree.test.ts --no-coverage
```

Expected: all tests PASS (22 tests across CategoryTree and Category-Expense integration)

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
npx jest --no-coverage
```

Expected: all suites PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/CategoryTree.ts
git commit -m "feat(domain): implement CategoryTree service — circular refs, deletion guard, path cascade, tree builder, expense validation"
```

---

### Task 4: Update Prisma schema and run migration

**Files:**
- Modify: `src/infrastructure/database/schema.prisma`

The `Category` model needs `path` and `level` columns. `householdId` is NOT added to the DB — there is only one household so the repository hardcodes `"default"` when mapping rows to domain records.

**Warning:** This migration adds non-nullable columns. Any existing rows will fail unless defaults are provided. Use `@default("")` and `@default(0)` as migration-time placeholders — the application always computes real values before saving.

- [ ] **Step 1: Update `schema.prisma` — add `path` and `level` to `Category`**

Replace the `Category` model in `src/infrastructure/database/schema.prisma`:

```prisma
model Category {
  id        String   @id @default(uuid())
  name      String
  parentId  String?
  path      String   @default("")
  level     Int      @default(0)
  createdAt DateTime @default(now())

  parent                Category?              @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children              Category[]             @relation("CategoryHierarchy")
  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]
  creditCardPurchases   CreditCardPurchase[]
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_category_path_level
```

Expected output includes: `✔  Generated Prisma Client` and no errors.

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/schema.prisma src/infrastructure/database/migrations/
git commit -m "feat(infra): add path and level columns to Category table"
```

---

### Task 5: Implement `PrismaCategoryRepository`

**Files:**
- Create: `src/infrastructure/repositories/PrismaCategoryRepository.ts`

Maps between Prisma's `category` rows (no `householdId`) and the domain `CategoryRecord` (requires `householdId`). Since this is a single-household system, `householdId` is always the constant `"default"` when reading from DB. The `save` method uses `upsert` to handle both create and update (needed for path cascade saves).

- [ ] **Step 1: Create `src/infrastructure/repositories/PrismaCategoryRepository.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../domain/repositories/ICategoryRepository";

const HOUSEHOLD_ID = "default";

type PrismaCategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  level: number;
  createdAt: Date;
};

function toRecord(row: PrismaCategoryRow): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    householdId: HOUSEHOLD_ID,
    path: row.path,
    level: row.level,
    createdAt: row.createdAt,
  };
}

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CategoryRecord[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { level: "asc" },
    });
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord> {
    const row = await this.prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        path: category.path,
        level: category.level,
      },
      update: {
        name: category.name,
        parentId: category.parentId,
        path: category.path,
        level: category.level,
      },
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full test suite to confirm everything still passes**

```bash
npx jest --no-coverage
```

Expected: all tests PASS (no regressions)

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/repositories/PrismaCategoryRepository.ts
git commit -m "feat(infra): implement PrismaCategoryRepository with upsert for path cascade support"
```

---

### Task 6: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry under `[Unreleased]`**

```markdown
### Added
- `src/domain/entities/Category.ts` — `createCategory()`: validates name (required, trimmed), validates householdId required, computes `path` (root = name, sub = parent/name) and `level` (root = 0, child = parent+1)
- `src/domain/services/CategoryTree.ts` — `isCircularReference()`: walks ancestor chain to detect cycles; `canDeleteCategory()` / `isLeafCategory()`: checks for children; `validateExpenseCategory()`: enforces null-allowed or leaf-only rule; `computeUpdatedPaths()`: cascades path and level to all descendants; `buildCategoryTree()`: builds nested tree from flat list
- `src/domain/repositories/ICategoryRepository.ts` — extended `CategoryRecord` with `householdId`, `path`, `level`
- `src/infrastructure/repositories/PrismaCategoryRepository.ts` — Prisma implementation with upsert (supports path cascade updates)
- `src/infrastructure/database/schema.prisma` — added `path String` and `level Int` to `Category` model
- Migration `add_category_path_level` — adds `path` and `level` columns to `category` table
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with Category module implementation"
```

---

## Self-Review

**Spec coverage:**
- ✅ Hierarchical structure via `parentId`
- ✅ Path generated and maintained by `createCategory` + `computeUpdatedPaths`
- ✅ Level calculated by `createCategory` + `computeUpdatedPaths`
- ✅ Circular reference validated by `isCircularReference`
- ✅ Deletion rules enforced by `canDeleteCategory`
- ✅ Repository interface updated + Prisma implementation
- ✅ Expense category validation via `validateExpenseCategory`
- ✅ No UI changes

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:**
- `CategoryRecord` defined in Task 1, used identically in Tasks 2, 3, 5 ✅
- `createCategory` input type defined and used only in Task 2 ✅
- `CategoryTreeNode` defined and exported in Task 3 ✅
- `PrismaCategoryRow` is a local type in Task 5, not exposed ✅
- `HOUSEHOLD_ID = "default"` constant in Task 5 ✅
