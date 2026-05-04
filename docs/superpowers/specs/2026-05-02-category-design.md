# Category Module — Design Spec

**Date:** 2026-05-02
**Status:** Approved

---

## Overview

Categories are hierarchical labels that can be attached to transactions. They form a tree structure where each category may have one parent. Expenses must use the most specific (leaf) category — attaching an expense to a parent category that still has children is not allowed.

Categories are scoped to a `householdId`. Paths are materialized strings (e.g. `"Food/Restaurants/Italian"`) that allow efficient sorting and display without recursive queries.

---

## Requirements

- Create a root category (no parent)
- Create a subcategory under an existing category
- Categories may be nested to any depth
- `path` materializes the full ancestry chain (e.g. `"Food/Restaurants"`)
- `level` records nesting depth (root = 0, child = 1, etc.)
- When a category is moved to a new parent, `path` and `level` update for the category and all its descendants
- Moving a category cannot create a circular reference (a descendant cannot become an ancestor)
- A category can only be deleted if it has no children (leaf-only deletion)
- Expenses must use leaf categories — assigning a parent category to an expense throws
- A category with `categoryId = null` on an expense means no category (always valid)

---

## Domain Model

### `CategoryRecord`

```ts
interface CategoryRecord {
  id: string
  name: string
  parentId: string | null
  path: string
  level: number
  householdId: string
  createdAt: Date
}
```

**Path rules:**
- Root: `path = name`
- Child: `path = parentPath + "/" + name`
- Trimmed name used in path computation

**Level rules:**
- Root: `level = 0`
- Direct child: `level = parent.level + 1`

---

## Domain Function — `src/domain/entities/Category.ts`

```ts
createCategory(input: CreateCategoryInput): CategoryRecord
```

```ts
type CreateCategoryInput = {
  id: string
  name: string
  parentId: string | null
  householdId: string
  parent?: { path: string; level: number } | null
}
```

**Validation:**
- `name` is required, trimmed, cannot be blank
- `householdId` is required
- `path` and `level` derived from `parent` (if provided) or defaulted for root

---

## Domain Service — `src/domain/services/CategoryTree.ts`

Pure functions, no side effects.

```ts
isCircularReference(categoryId: string, newParentId: string, categories: CategoryRecord[]): boolean
// Returns true if assigning newParentId as parent of categoryId would create a cycle.
// Walks the ancestor chain of newParentId upward — if categoryId appears, it's a cycle.
// Also returns true if categoryId === newParentId (self-reference).

canDeleteCategory(categoryId: string, categories: CategoryRecord[]): boolean
// Returns true if the category has no children (safe to delete).

isLeafCategory(categoryId: string, categories: CategoryRecord[]): boolean
// Alias of canDeleteCategory — same check, semantic name for expense context.

validateExpenseCategory(categoryId: string | null, categories: CategoryRecord[]): void
// If categoryId is null → passes (category is optional).
// If category not found → throws "Category not found".
// If category is not a leaf → throws "Expense must use the most specific category".

computeUpdatedPaths(
  categoryId: string,
  newParent: CategoryRecord | null,
  categories: CategoryRecord[]
): CategoryRecord[]
// Returns updated list of all categories with the target and all its descendants
// having recalculated path and level after the parent change.
// Cascade is recursive through the full descendant subtree.

buildCategoryTree(categories: CategoryRecord[]): CategoryTreeNode[]
// Builds a tree from a flat list. Root nodes have parentId === null.
// Returns array of CategoryTreeNode, each with nested children.
```

```ts
type CategoryTreeNode = {
  category: CategoryRecord
  children: CategoryTreeNode[]
}
```

---

## Repository Interface — `src/domain/repositories/ICategoryRepository.ts`

```ts
interface ICategoryRepository {
  findAll(): Promise<CategoryRecord[]>
  findById(id: string): Promise<CategoryRecord | null>
  save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord>
  delete(id: string): Promise<void>
}
```

`save` uses upsert semantics in the infrastructure layer — insert on first call, update on reparent. The domain does not enforce this; it is an infrastructure concern.

---

## Infrastructure Note

The Prisma `Category` table has a `path` column and a `level` column. When reparenting, the application must:
1. Call `computeUpdatedPaths` to get new records for all affected categories
2. Persist each updated record via `repo.save`

This is an application-layer responsibility, not domain.

---

## Testing Strategy

### Entity (TDD — required)

`tests/domain/entities/Category.test.ts`:
- Root category: `path = name`, `level = 0`
- Subcategory: `path = parentPath/name`, `level = parentLevel + 1`
- Deep nesting: path includes all ancestors
- Empty name → throws "Name is required"
- Whitespace-only name → throws "Name is required"
- Missing `householdId` → throws "Household is required"
- No `workspaceId` on result

### CategoryTree service (TDD — required)

`tests/domain/services/CategoryTree.test.ts`:

`isCircularReference`:
- No cycle → false
- Self-reference → true
- Category would become its own ancestor → true

`canDeleteCategory`:
- Leaf node → true
- Node with children → false

`computeUpdatedPaths`:
- Reparent updates path and level of target
- Reparent cascades to all descendants

`buildCategoryTree`:
- Root nodes at top level
- Children nested under parent
- Multi-level nesting works
- Leaf nodes have empty `children` array

`validateExpenseCategory`:
- `null` → passes
- Leaf category → passes
- Non-existent category → throws "Category not found"
- Non-leaf category → throws "Expense must use the most specific category"

### Repository contract

`tests/domain/repositories/ICategoryRepository.test.ts`:
- Save and retrieve by id
- findAll returns all saved categories
- delete removes record

---

## Out of Scope

- Category renaming (name change would require path cascade — not yet implemented)
- Moving categories (reparent use case — not yet implemented as use case, only the domain pure function exists)
- UI layer
- Infrastructure Prisma implementation details
