# Edit Transactions — Design Spec

**Date:** 2026-05-10
**Scope:** Add edit capability to transactions (INCOME/EXPENSE), installment purchases (credit card), and individual installments on the transactions screen.

---

## Problem

The transactions screen only supports delete. Users cannot correct mistakes in existing records.

---

## Scope

| Entity | Edit support |
|---|---|
| Expense (EXPENSE transaction) | Full edit: personId, amount, date, paymentMethod, categoryId, description |
| Income (INCOME transaction) | Full edit: personId, amount, date, source, categoryId, description |
| Credit card purchase | Full edit: description, totalAmount, purchaseDate, categoryId, creditCardId (redistributes installment amounts) |
| Individual installment | Lightweight edit: amount + description only |

---

## Backend

### New API routes

**`PUT /api/expenses/[id]`** — adds PUT handler to existing `src/app/api/expenses/[id]/route.ts`

Request body:
```json
{ "personId": "...", "amount": 100.0, "date": "2026-05-10", "paymentMethod": "PIX", "categoryId": null, "description": "..." }
```
Returns 204 on success.

**`PUT /api/incomes/[id]`** — new file `src/app/api/incomes/[id]/route.ts`

Request body:
```json
{ "personId": "...", "amount": 100.0, "date": "2026-05-10", "source": "SALARY", "categoryId": null, "description": "..." }
```
Returns 204 on success.

**`PUT /api/installments/[id]`** — adds PUT handler to existing `src/app/api/installments/[id]/route.ts`

Request body:
```json
{ "amount": 50.0, "description": "..." }
```
Returns 204 on success.

**`PUT /api/credit-card-purchases/[id]`** — already exists. No changes needed.

### New use cases

**`UpdateExpenseUseCase`** (`src/application/use-cases/UpdateExpenseUseCase.ts`)
- Validates personId, amount, date, paymentMethod
- Calls `transactionRepo.update(id, fields)`
- Throws if transaction not found

**`UpdateIncomeUseCase`** (`src/application/use-cases/UpdateIncomeUseCase.ts`)
- Validates personId, amount, date, source
- Calls `transactionRepo.update(id, fields)`
- Throws if transaction not found

### Repository changes

**`ITransactionRepository`** — add:
```ts
update(id: string, fields: Partial<Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">>): Promise<TransactionRecord>;
```

**`PrismaTransactionRepository`** — implement `update()` via `prisma.transaction.update()`

**`ICreditCardPurchaseRepository`** — add:
```ts
updateInstallment(id: string, fields: { amount: number; description: string }): Promise<void>;
```

**`PrismaCreditCardPurchaseRepository`** — implement `updateInstallment()` via `prisma.installment.update()`

---

## UI

### `UnifiedTransactionForm` changes

Add optional props:
```ts
editMode?: {
  transactionId?: string;  // present when editing expense/income
  purchaseId?: string;     // present when editing credit card purchase
}
initialValues?: {
  type: FormType;
  personId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  source: string;
  creditCardId: string;
  categoryId: string;
  description: string;
}
```

Behaviour when `editMode` is present:
- Pre-populate all fields from `initialValues`
- Hide type switcher (type is locked to `initialValues.type`)
- Submit calls `PUT` to the appropriate endpoint instead of `POST`
- Submit button label: "Salvar alterações"
- On success: call `onSuccess()` + `router.refresh()`

### `TransactionTable` changes

- Accept new `onEdit(t: Transaction)` callback prop
- Dropdown items: `[{ label: "Editar", onClick: () => onEdit(t) }, { label: "Excluir", variant: "destructive", ... }]`

### `InstallmentTable` changes

- Accept new `onEditInstallment(inst: InstallmentRecord)` + `onEditPurchase(inst: InstallmentRecord)` callback props
- Dropdown gains two items above "Excluir":
  - "Editar parcela" → `onEditInstallment(inst)`
  - "Editar compra" → `onEditPurchase(inst)`

### `TransactionPageClient` changes

New state:
```ts
const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
const [editingInstallment, setEditingInstallment] = useState<InstallmentRecord | null>(null);
const [editingPurchase, setEditingPurchase] = useState<InstallmentRecord | null>(null);
```

Pass callbacks down:
- `TransactionTable` receives `onEdit={(t) => setEditingTransaction(t)}`
- `InstallmentTable` receives `onEditInstallment` + `onEditPurchase` setters

Three additional dialogs:

1. **Edit transaction dialog** — `UnifiedTransactionForm` with `editMode={{ transactionId: editingTransaction.id }}` and `initialValues` derived from the transaction. Title: "Editar Transação".

2. **Edit installment dialog** — lightweight inline form (no `UnifiedTransactionForm`) with amount + description fields only. Calls `PUT /api/installments/{id}`. Title: "Editar Parcela".

3. **Edit purchase dialog** — `UnifiedTransactionForm` with `type="credit"` locked, `editMode={{ purchaseId: editingPurchase.creditCardPurchaseId }}`, `initialValues` derived from the installment record. Title: "Editar Compra".

`InstallmentRecord` already carries `creditCardPurchaseId` — no schema changes needed to pass the purchase ID.

---

## Data flow

```
User clicks "Editar" in dropdown
  → sets editingTransaction / editingInstallment / editingPurchase state
  → dialog opens with pre-filled form
  → user edits + submits
  → PUT to correct API route
  → router.refresh() reloads page data
  → dialog closes
```

---

## Error handling

- API routes validate required fields; return 400 with `{ error: "..." }` on failure
- Form displays error message below submit button (same pattern as create flow)
- 404 if record not found → return 404 with `{ error: "Not found" }`

---

## Testing

- Unit tests for `UpdateExpenseUseCase` and `UpdateIncomeUseCase` in `tests/application/use-cases/`
- Follow TDD: write failing tests first, then implement use cases
