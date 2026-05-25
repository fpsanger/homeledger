# Loyalty Points Transfer Feature

**Date:** 2026-05-25
**Status:** Approved

## Overview

Allow users to record transfers of loyalty points between programs (e.g., Livelo → Latam), including a bonus multiplier. A transfer deducts points from the source program and adds points to the destination program, optionally with a bonus percentage that inflates the received amount.

**Example:** 10,000 points sent with 100% bonus → 20,000 points received.

## Architecture

Follows Clean Architecture layers already in use for loyalty:

- **Domain** — `LoyaltyTransfer` entity and `ILoyaltyTransferRepository` already exist
- **Application** — `CreateLoyaltyTransferUseCase` already exists; need `ListLoyaltyTransfersUseCase`
- **Infrastructure** — `PrismaLoyaltyTransferRepository` already exists; add `findAll()` method
- **API** — `POST /api/loyalty/transfers` already exists; add `GET /api/loyalty/transfers`
- **UI** — new page `/loyalty/transfers` with form dialog and history table

No domain changes required. The bonus percentage is a UI-only concept: `pointsReceived = pointsSent × (1 + bonus / 100)`. The API already accepts `pointsSent` and `pointsReceived` as separate fields.

## Components

### `GET /api/loyalty/transfers`

Returns all transfers ordered by `transferDate` descending. Each record includes `fromProgramId`, `toProgramId`, `pointsSent`, `pointsReceived`, `costBrl`, `transferDate`, `personId`, `description`.

### `ListLoyaltyTransfersUseCase`

Calls `transferRepo.findAll()` and returns the list. Simple pass-through.

### `ILoyaltyTransferRepository.findAll()`

New method returning all `LoyaltyTransferRecord[]`.

### `PrismaLoyaltyTransferRepository.findAll()`

Implements `findAll()` via `prisma.loyaltyTransfer.findMany({ orderBy: { transferDate: 'desc' } })`.

### `src/app/loyalty/transfers/page.tsx`

Server component. Fetches transfers and programs in parallel. Passes both to `TransfersPageClient`.

### `src/components/loyalty/TransfersPageClient.tsx`

Client component. Owns `showDialog` state. Renders `PageHeader` with "+ Nova Transferência" button, `LoyaltyTransferDialog`, and `LoyaltyTransferTable`.

### `src/components/loyalty/LoyaltyTransferDialog.tsx`

Dialog wrapping `LoyaltyTransferForm`. Uses existing `<Dialog>` component.

### `src/components/loyalty/LoyaltyTransferForm.tsx`

Form fields:
- **De** — `<select>` of all programs
- **Para** — `<select>` of all programs, excludes selected source
- **Pontos enviados** — number input (min 1)
- **Bônus (%)** — number input (min 0, default 0)
- **Pontos recebidos** — read-only display, computed live: `Math.round(pointsSent × (1 + bonus / 100))`
- **Data** — `<DatePicker>`
- **Descrição** — optional text input

On submit: POSTs to `/api/loyalty/transfers` with `pointsReceived` computed. On success: calls `onSuccess()` which closes dialog and calls `router.refresh()`.

### `src/components/loyalty/LoyaltyTransferTable.tsx`

Table columns: Data · De · Para · Enviados · Bônus · Recebidos · Descrição

Bonus is back-computed from the record: `((pointsReceived / pointsSent) - 1) × 100`. Shown as percentage (e.g., "100%"). Program names resolved by matching `fromProgramId`/`toProgramId` against the programs list passed as prop.

## Navigation

Add "Transferências" link to TopNav `navLinks` array pointing to `/loyalty/transfers`.

## Data Flow

1. User clicks "+ Nova Transferência" on `/loyalty/transfers`
2. Dialog opens with form pre-populated with today's date
3. User selects source/destination programs, enters points and bonus %
4. "Pontos recebidos" updates live as user types
5. On submit: `POST /api/loyalty/transfers` → `CreateLoyaltyTransferUseCase` creates transfer record + two transactions (`TRANSFER_OUT` on source, `TRANSFER_IN` on destination)
6. Dialog closes, `router.refresh()` re-fetches server data
7. New row appears at top of history table

## Error Handling

- API returns 400 if `fromProgramId === toProgramId` — form should also validate this client-side before submit
- `pointsReceived` must be `>= pointsSent` (existing domain rule) — satisfied as long as bonus ≥ 0
- Network errors shown inline in form

## Out of Scope

- Editing or deleting transfers
- Filtering/sorting the history table
- Cost (R$) field — not exposed in the form for simplicity
