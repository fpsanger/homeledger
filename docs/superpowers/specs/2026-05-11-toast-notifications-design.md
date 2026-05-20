# Toast Notifications Design

**Date:** 2026-05-11

## Goal

Replace inline error state with sonner toasts across all 18 UI components. Add success toasts on mutations.

## Infrastructure

- Install `sonner` package
- Add shadcn sonner component via `npx shadcn add sonner` → `src/components/ui/sonner.tsx`
- Mount `<Toaster />` in `src/app/layout.tsx`

## Component Migration

**Files to migrate (18):**

- `src/components/categories/CategoryForm.tsx`
- `src/components/categories/CategoryEditDialog.tsx`
- `src/components/categories/CategoryList.tsx`
- `src/components/credit-cards/CreditCardForm.tsx`
- `src/components/credit-cards/CreditCardList.tsx`
- `src/components/credit-cards/ClosureManager.tsx`
- `src/components/credit-cards/BillView.tsx`
- `src/components/installments/InstallmentsList.tsx`
- `src/components/layout/TopNav.tsx`
- `src/components/monthly-view/InstallmentTable.tsx`
- `src/components/monthly-view/TransactionTable.tsx`
- `src/components/transactions/UnifiedTransactionForm.tsx`
- `src/components/transactions/IncomeForm.tsx`
- `src/components/transactions/ExpenseForm.tsx`
- `src/components/transactions/InstallmentForm.tsx`
- `src/components/transactions/EditInstallmentForm.tsx`
- `src/components/people/PersonForm.tsx`
- `src/components/people/PersonList.tsx`

**Per-component changes:**

1. Remove `const [error, setError] = useState<string | null>(null)`
2. Remove `{error && <p className="text-sm text-destructive">{error}</p>}`
3. Replace `setError(msg)` → `toast.error(msg)`
4. Add `toast.success(msg)` after `router.refresh()` on success
5. Add `import { toast } from "sonner"`

**Success messages (Portuguese, matching existing UI language):**

| Domain | Action | Message |
|--------|--------|---------|
| Categories | create | "Categoria criada com sucesso." |
| Categories | edit | "Categoria atualizada." |
| Categories | delete | "Categoria excluída." |
| Credit cards | create | "Cartão criado com sucesso." |
| Credit cards | delete | "Cartão excluído." |
| Transactions/income/expense | create/edit | "Transação salva com sucesso." |
| Transactions | delete | "Transação excluída." |
| People | create | "Pessoa criada com sucesso." |
| People | delete | "Pessoa excluída." |
| Installments | create/edit | "Parcelamento salvo com sucesso." |

## Out of Scope

- Custom toast positioning/styling beyond sonner defaults
- Per-component loading states
- Undo actions
