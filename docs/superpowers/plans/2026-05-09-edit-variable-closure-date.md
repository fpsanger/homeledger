# Edit Variable Closure Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an edit button to each closure row in `ClosureManagerDialog` that pre-fills the existing form so users can correct a closure day.

**Architecture:** Pure UI state change in one component. The backend `POST /api/credit-cards/[id]/closures` already upserts on `(creditCardId, year, month)`, so no API or domain changes are needed. A new `editingId` state drives edit mode; the form is reused as-is.

**Tech Stack:** React (useState), TypeScript, Tailwind CSS, existing shadcn/ui components (Button, Badge, Input, Label)

---

### Task 1: Add edit mode to ClosureManagerDialog

**Files:**
- Modify: `src/components/credit-cards/ClosureManager.tsx`

**Context:**

The component lives at `src/components/credit-cards/ClosureManager.tsx`. It renders:
1. A list of closure records (fetched via `GET /api/credit-cards/[id]/closures`)
2. A form at the bottom to add a new closure (POSTs to same route)

The `setClosure` backend already upserts — posting `{ year, month, closureDay }` for an existing `(year, month)` pair overwrites the `closureDay`. No backend change needed.

Current state shape:
```ts
const [year, setYear] = useState(String(new Date().getFullYear()));
const [month, setMonth] = useState(String(new Date().getMonth() + 1));
const [closureDay, setClosureDay] = useState("");
```

- [ ] **Step 1: Add `editingId` state and a `startEdit` helper**

In `ClosureManagerDialog`, add after the existing state declarations:

```ts
const [editingId, setEditingId] = useState<string | null>(null);

function startEdit(c: Closure) {
  setEditingId(c.id);
  setYear(String(c.year));
  setMonth(String(c.month));
  setClosureDay(String(c.closureDay));
}

function cancelEdit() {
  setEditingId(null);
  setYear(String(new Date().getFullYear()));
  setMonth(String(new Date().getMonth() + 1));
  setClosureDay("");
}
```

- [ ] **Step 2: Add edit button to each closure row**

Replace the existing closure row `<div>` (currently lines 72–78) with:

```tsx
<div key={c.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/50">
  <span className="text-muted-foreground">
    {MONTH_NAMES[c.month - 1]} {c.year}
  </span>
  <div className="flex items-center gap-2">
    <Badge variant="secondary">Dia {c.closureDay}</Badge>
    <button
      type="button"
      onClick={() => startEdit(c)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Editar fechamento"
    >
      ✏️
    </button>
  </div>
</div>
```

- [ ] **Step 3: Update form to reflect edit mode**

Replace the form section header (currently `<p className="text-sm font-medium mb-3">Definir Data de Fechamento</p>`) with:

```tsx
<p className="text-sm font-medium mb-3">
  {editingId ? "Editar Fechamento" : "Definir Data de Fechamento"}
</p>
```

- [ ] **Step 4: Disable year/month inputs and add Cancel button in edit mode**

Update the year `<Input>`:
```tsx
<Input
  id="cl-year"
  type="number"
  value={year}
  onChange={(e) => setYear(e.target.value)}
  required
  disabled={!!editingId}
/>
```

Update the month `<Input>`:
```tsx
<Input
  id="cl-month"
  type="number"
  min="1"
  max="12"
  value={month}
  onChange={(e) => setMonth(e.target.value)}
  required
  disabled={!!editingId}
/>
```

Replace the submit button area (currently just the `<Button type="submit">`) with:

```tsx
<div className="flex gap-2 self-end">
  {editingId && (
    <Button type="button" variant="outline" onClick={cancelEdit}>
      Cancelar
    </Button>
  )}
  <Button type="submit" disabled={loading}>
    {loading ? "Salvando…" : editingId ? "Atualizar" : "Salvar Fechamento"}
  </Button>
</div>
```

- [ ] **Step 5: Clear editingId after successful submit**

In `handleSubmit`, after `load()` is called on success, add:

```ts
setEditingId(null);
```

So the full success block becomes:
```ts
setClosureDay("");
setEditingId(null);
load();
```

- [ ] **Step 6: Verify manually**

1. Run `npm run dev`
2. Open a VARIABLE credit card's closure manager
3. Confirm existing closures show a ✏️ button
4. Click ✏️ — verify year/month pre-fill and are disabled, closureDay pre-fills
5. Change closureDay and submit — verify list updates with new value
6. Click ✏️ then Cancelar — verify form resets to defaults
7. Confirm FIXED card closure manager is unaffected (no closures to edit)

- [ ] **Step 7: Commit**

```bash
git add src/components/credit-cards/ClosureManager.tsx
git commit -m "feat: add edit option for variable closure dates in ClosureManagerDialog"
```
