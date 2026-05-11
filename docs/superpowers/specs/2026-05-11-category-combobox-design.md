# Category Combobox Design

**Date:** 2026-05-11  
**Status:** Approved

## Problem

All category selects in the app are native `<select>` elements. With many categories, users must scroll up and down to find what they need. Two-tier forms add extra friction (parent dropdown → subcategory dropdown). No search/filter capability exists.

## Goal

Replace all category dropdowns with a single reusable `CategoryCombobox` component — searchable, grouped, single interaction to pick any category.

## Component: `CategoryCombobox`

**File:** `src/components/ui/category-combobox.tsx`

**Props:**
```typescript
interface CategoryComboboxProps {
  categories: Category[]       // { id, name, parentId: string | null, path: string }
  value: string                // selected category id, or "" for none
  onChange: (id: string) => void
  placeholder?: string         // default: "Selecione a categoria"
  disabled?: boolean
}
```

**Rendering:**
- Uses shadcn `Command` (cmdk) inside a `Popover`
- Trigger: a `Button` showing selected category name or placeholder
- Root category **with children** → `CommandGroup` (non-selectable label)
  - Children → `CommandItem` inside that group
- Root category **without children** → `CommandItem` at top level
- "Nenhuma" option clears selection (calls `onChange("")`)
- Search filters across group labels and item names

**Install:** `npx shadcn@latest add combobox` (adds `cmdk` dependency + `Command` component)

## State Changes (Two-tier forms)

`UnifiedTransactionForm` and `InstallmentsList` currently use two state vars and derived logic to handle parent → subcategory selection:

```typescript
// Removed:
const [parentCategoryId, setParentCategoryId] = useState(...)
const [subCategoryId, setSubCategoryId] = useState(...)
function resolveInitialCategory(...) { ... }
const rootCategories = ...
const subCategories = ...
const selectedParentHasChildren = ...
const categoryId = selectedParentHasChildren ? subCategoryId : parentCategoryId

// Replaced with:
const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "")
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/category-combobox.tsx` | **New** — reusable combobox component |
| `src/components/transactions/UnifiedTransactionForm.tsx` | Replace 2 dropdowns, delete two-tier state |
| `src/components/installments/InstallmentsList.tsx` | Replace 2 dropdowns, delete two-tier state |
| `src/components/transactions/ExpenseForm.tsx` | Replace 1 select |
| `src/components/transactions/IncomeForm.tsx` | Replace 1 select |
| `src/components/transactions/InstallmentForm.tsx` | Replace 1 select |
| `src/components/categories/CategoryForm.tsx` | Replace 1 select (caller already filters root-only) |
| `src/components/categories/CategoryEditDialog.tsx` | Replace 1 select (caller already filters cycle-safe) |
| `src/components/monthly-view/TransactionTable.tsx` | Replace 1 inline filter select |

## Constraints Preserved

- `CategoryEditDialog` cycle-prevention filter (no self/descendants as parent) stays in the form — passed as pre-filtered `categories` prop to combobox. No change to that logic.
- `CategoryForm` root-only filter stays in the form — same pattern.
- `TransactionTable` dynamic filter (only used categories shown) stays in the form.

## Verification

1. Open any transaction form — combobox appears, search filters categories in real time
2. Pick a subcategory — saved correctly
3. Pick a root category without children — saved correctly
4. Edit existing transaction — combobox pre-selects correct category
5. CategoryForm parent picker — shows only root categories, searchable
6. CategoryEditDialog — cannot select self or descendants as parent
7. TransactionTable filter — combobox filters table by category
8. No regressions on existing form submit flows
