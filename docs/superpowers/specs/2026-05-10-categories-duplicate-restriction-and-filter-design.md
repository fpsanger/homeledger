# Categories: Duplicate Restriction & Name Filter

**Date:** 2026-05-10

## Overview

Two improvements to the categories feature:
1. Prevent duplicate root-level category names
2. Add a name filter to the categories list screen

---

## 1. Duplicate Restriction

### Rule
Root-level categories (parentId = null) must have unique names within a household. Child categories have no uniqueness constraint.

### Examples
- "Food" at root → blocked if another "Food" at root exists
- "Expenses" under "Food" and "Expenses" under "Travel" → allowed

### Changes

**Domain — `ICategoryRepository`**
Add method:
```ts
findRootByName(name: string, householdId: string): Promise<CategoryRecord | null>
```

**Domain — `DuplicateCategoryError`**
New domain error class in `src/domain/errors/DuplicateCategoryError.ts`.

**Application — `CreateCategoryUseCase`**
Before saving: if `parentId === null`, call `findRootByName`. If result exists, throw `DuplicateCategoryError`.

**Application — `UpdateCategoryUseCase`**
Same check when renaming a root category (exclude self from match).

**Infrastructure — Prisma repository**
Implement `findRootByName` via `prisma.category.findFirst({ where: { name, householdId, parentId: null } })`.

**Infrastructure — DB migration**
Add partial unique index:
```sql
CREATE UNIQUE INDEX categories_root_name_unique ON categories(name, "householdId") WHERE "parentId" IS NULL;
```

**API — `POST /api/categories` and `PATCH /api/categories/[id]`**
Catch `DuplicateCategoryError` → respond 409 `{ error: "Categoria já existe" }`.

**UI — `CategoryForm`**
Display API error inline when response is 409.

---

## 2. Name Filter

### Rule
Client-side text filter on the categories list. No API changes.

### Changes

**UI — `CategoryList`**
- Add `query` state (string)
- Render `<Input placeholder="Filtrar por nome..." />` above the table
- Filter sorted list: `sorted.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))`
- Reset `page` to 0 when `query` changes

---

## Out of Scope
- Server-side filtering
- Uniqueness for child categories
- Filter by parent or level
