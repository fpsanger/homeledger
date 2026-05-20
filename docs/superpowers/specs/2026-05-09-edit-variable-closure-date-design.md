# Edit Variable Closure Date

**Date:** 2026-05-09  
**Status:** Approved  
**Scope:** UI only — `src/components/credit-cards/ClosureManager.tsx`

## Context

Variable credit cards store a `closureDay` per `(year, month)`. The backend already upserts on `(creditCardId, year, month)`, so POSTing with an existing year+month overwrites the closure day. No API, use case, domain, or migration changes are needed.

## Feature

Add an edit affordance to each closure row in `ClosureManagerDialog`. Clicking edit pre-fills the existing form with that row's values. The user corrects `closureDay` and submits — the same POST endpoint handles it.

## Component Changes (`ClosureManagerDialog`)

### New state
- `editingId: string | null` — ID of the closure being edited, or `null` when adding new

### Closure row
- Add a small edit button (pencil icon) on each row
- On click: set `year`, `month`, `closureDay` in form state + set `editingId` to that closure's ID

### Form
- Header label: "Editar Fechamento" when `editingId !== null`, "Definir Data de Fechamento" otherwise
- Year and month inputs: disabled when `editingId !== null` (can't change identity of a closure)
- "Cancelar" button: visible only when `editingId !== null`; clears `editingId` and resets form to defaults
- Submit button label: "Atualizar" when editing, "Salvar Fechamento" when adding
- Submit logic: unchanged — POST to `/api/credit-cards/[id]/closures`; upsert handles create vs update

## Data Flow

```
User clicks edit on row (year=2025, month=3, closureDay=10)
  → form pre-filled, editingId set
User changes closureDay to 15, submits
  → POST { year: 2025, month: 3, closureDay: 15 }
  → backend upserts → closureDay updated
  → load() refreshes list, editingId cleared
```

## Error Handling

No changes. Existing error display covers validation failures from the use case (`closureDay` out of range, card not VARIABLE).

## Testing

- Manual: open ClosureManagerDialog on a VARIABLE card, edit a closure day, verify list updates
- No domain or use case tests required (no logic changed)
