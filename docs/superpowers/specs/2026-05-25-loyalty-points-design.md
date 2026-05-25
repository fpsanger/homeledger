# Loyalty Points / Miles Tracker — Design Spec

**Date:** 2026-05-25  
**Status:** Approved

## Context

HomeLedger tracks household finances but has no way to manage loyalty program balances (airline miles, hotel points, bank rewards). The user wants to track multiple programs, record how points were acquired and used, and — critically — understand the **real cost per point** using FIFO lot accounting so ROI on redemptions can be calculated accurately.

FIFO cost basis applies only to **purchased** points and **TRANSFER_IN with costBrl**. Earned, bonus, and free transfer points have zero cost basis. All costs displayed as R$/1k points.

---

## Architecture

Clean Architecture layers, consistent with the existing codebase:

- Domain: `LoyaltyProgram`, `LoyaltyTransaction`, `LoyaltyTransfer` entities, `LoyaltyFifo` domain service
- Application: use cases for programs, transactions, transfers + report
- Infrastructure: Prisma models, repositories, migrations, API routes
- UI: two Next.js pages under `/loyalty`

---

## Domain Layer

### Entity: `LoyaltyProgram`

```
id          string
name        string
type        AIRLINE | HOTEL | BANK | OTHER
color       string (hex, for UI display)
createdAt   DateTime
updatedAt   DateTime
```

### Entity: `LoyaltyTransfer`

One record per transfer between programs. Parent entity that owns the two linked `LoyaltyTransaction` records.

```
id              string
fromProgramId   string
toProgramId     string
pointsSent      number    — deducted from source (> 0)
pointsReceived  number    — credited to destination including bonus (> 0); bonus = pointsReceived - pointsSent
costBrl         number | null  — optional: cost basis to carry into destination lot
transferDate    DateTime
personId        string | null
description     string | null
createdAt       DateTime
updatedAt       DateTime
```

**Validation rules:**
- `pointsSent` > 0
- `pointsReceived` >= `pointsSent` (bonus can be zero but not negative)
- `costBrl` optional; if provided, > 0

**On creation, system atomically creates two `LoyaltyTransaction` records:**
- `TRANSFER_OUT` on `fromProgramId`: points = pointsSent, transferId = this.id
- `TRANSFER_IN` on `toProgramId`: points = pointsReceived, costBrl = this.costBrl, transferId = this.id

### Entity: `LoyaltyTransaction`

```
id          string
programId   string
personId    string | null    — for person-based filtering
transferId  string | null    — links to LoyaltyTransfer if type is TRANSFER_OUT or TRANSFER_IN
type        PURCHASE | EARN | BONUS | REDEEM | TRANSFER_OUT | TRANSFER_IN | EXPIRE | ADJUSTMENT
points      number           — positive for all types except ADJUSTMENT (can be negative)
date        DateTime
description string | null
expiresAt   DateTime | null  — PURCHASE, EARN, BONUS only

costBrl     number | null    — PURCHASE: required > 0; TRANSFER_IN: set from LoyaltyTransfer.costBrl
valueBrl    number | null    — REDEEM only: value received in R$

createdAt   DateTime
updatedAt   DateTime
```

**Removed from LoyaltyTransaction** (now on `LoyaltyTransfer`): `targetProgramId`, `sourceProgramId`, `bonusPoints`

**Validation rules (enforced in domain):**
- `PURCHASE` → `costBrl` required and > 0; `points` > 0; `expiresAt` optional
- `EARN` → `points` > 0; `expiresAt` optional
- `BONUS` → `points` > 0; `expiresAt` optional
- `REDEEM` → `valueBrl` required and > 0; `points` > 0
- `TRANSFER_OUT` → `transferId` required; `points` > 0
- `TRANSFER_IN` → `transferId` required; `points` > 0; `costBrl` optional
- `EXPIRE` → `points` > 0
- `ADJUSTMENT` → `points` can be negative or positive
- `transferId` must be null for all non-transfer types

### FIFO Balance Impact

| Type | Balance | Creates cost lot | Consumes FIFO lots | Value |
|---|---|---|---|---|
| PURCHASE | +points | yes (costBrl) | — | — |
| EARN | +points | no | — | — |
| BONUS | +points | no | — | — |
| REDEEM | −points | — | yes | valueBrl |
| TRANSFER_OUT | −points | — | yes | — |
| TRANSFER_IN | +points | only if costBrl provided | — | — |
| EXPIRE | −points | — | yes (value = 0) | — |
| ADJUSTMENT (+) | +points | zero-cost lot | — | — |
| ADJUSTMENT (−) | −points | — | yes | — |

### Domain Service: `LoyaltyFifo`

Input: all transactions for a program (including TRANSFER_OUT/IN linked via transferId), sorted ascending by date.

Algorithm:
1. Maintain a queue of cost lots: `{ points: number, costBrl: number, remainingPoints: number, expiresAt: Date | null }`
2. Walk transactions in date order:
   - `PURCHASE` → push lot with costBrl and expiresAt
   - `EARN` / `BONUS` → no lot; balance only
   - `TRANSFER_IN` → if costBrl provided, push lot; else balance only
   - `ADJUSTMENT` positive → push zero-cost lot; negative → consume FIFO lots
   - `REDEEM` / `TRANSFER_OUT` / `EXPIRE` → consume oldest lots FIFO until `points` satisfied
     - Compute `totalCostBrl` = sum of consumed portions
     - Compute `costPer1kPoints` = `(totalCostBrl / points) * 1000`
     - For `REDEEM`: compute `roi` = `(valueBrl - totalCostBrl) / totalCostBrl * 100`; if `totalCostBrl = 0`, roi = null
     - For `EXPIRE`: value = 0, roi = null
3. Return enriched transactions with `fifoData: { costBrl, costPer1kPoints, roi }` on each outflow type

**Edge case:** If points consumed exceed purchased lots (free points cover gap), cost basis for free portion is zero.

Output summary per program:
```
currentBalance      number
totalInvested       number   (sum of PURCHASE costBrl + TRANSFER_IN costBrl)
avgCostPer1kPoints  number   ((totalInvested / totalPurchasedPoints) * 1000)
totalValueRedeemed  number   (sum of REDEEM valueBrl)
totalExpired        number   (sum of EXPIRE points)
overallRoi          number   ((totalValueRedeemed - totalInvested) / totalInvested * 100)
```

---

## Application Layer

### LoyaltyProgram use cases

| Use Case | Input | Notes |
|---|---|---|
| `CreateLoyaltyProgram` | name, type, color | |
| `UpdateLoyaltyProgram` | id + partial fields | |
| `DeleteLoyaltyProgram` | id | Rejects if program has transactions |
| `ListLoyaltyPrograms` | — | Household-level balance; no person filter |

### LoyaltyTransfer use cases

| Use Case | Input | Notes |
|---|---|---|
| `CreateLoyaltyTransfer` | fromProgramId, toProgramId, pointsSent, pointsReceived, costBrl?, transferDate, personId?, description? | Atomically creates LoyaltyTransfer + TRANSFER_OUT + TRANSFER_IN transactions |
| `DeleteLoyaltyTransfer` | id | Deletes transfer + both linked transactions atomically |

### LoyaltyTransaction use cases

| Use Case | Input | Notes |
|---|---|---|
| `CreateLoyaltyTransaction` | all fields per type | Non-transfer types only; TRANSFER_OUT/IN created via CreateLoyaltyTransfer |
| `UpdateLoyaltyTransaction` | id + partial fields | Non-transfer types only |
| `DeleteLoyaltyTransaction` | id | Non-transfer types only; transfers deleted via DeleteLoyaltyTransfer |

### LoyaltyReport use case

`GetLoyaltyProgramReport(programId, personId?)`:
1. Load all transactions for `programId` (filtered by `personId` if provided)
2. Sort by date ascending
3. Run `LoyaltyFifo` service
4. Return summary + enriched transaction list

---

## Infrastructure Layer

### Prisma Models

```prisma
model LoyaltyProgram {
  id                String               @id @default(uuid())
  name              String
  type              LoyaltyProgramType
  color             String
  transactions      LoyaltyTransaction[]
  transfersFrom     LoyaltyTransfer[]    @relation("TransferFrom")
  transfersTo       LoyaltyTransfer[]    @relation("TransferTo")
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
}

model LoyaltyTransfer {
  id              String               @id @default(uuid())
  fromProgramId   String
  toProgramId     String
  pointsSent      Float
  pointsReceived  Float
  costBrl         Float?
  transferDate    DateTime
  personId        String?
  description     String?
  fromProgram     LoyaltyProgram       @relation("TransferFrom", fields: [fromProgramId], references: [id])
  toProgram       LoyaltyProgram       @relation("TransferTo", fields: [toProgramId], references: [id])
  person          Person?              @relation(fields: [personId], references: [id])
  transactions    LoyaltyTransaction[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}

model LoyaltyTransaction {
  id          String                 @id @default(uuid())
  programId   String
  personId    String?
  transferId  String?
  type        LoyaltyTransactionType
  points      Float
  date        DateTime
  description String?
  expiresAt   DateTime?
  costBrl     Float?
  valueBrl    Float?
  program     LoyaltyProgram         @relation(fields: [programId], references: [id])
  person      Person?                @relation(fields: [personId], references: [id])
  transfer    LoyaltyTransfer?       @relation(fields: [transferId], references: [id], onDelete: Cascade)
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
}

enum LoyaltyProgramType {
  AIRLINE
  HOTEL
  BANK
  OTHER
}

enum LoyaltyTransactionType {
  PURCHASE
  EARN
  BONUS
  REDEEM
  TRANSFER_OUT
  TRANSFER_IN
  EXPIRE
  ADJUSTMENT
}
```

### Repositories

- `ILoyaltyProgramRepository` — save, findById, findAll, delete
- `ILoyaltyTransactionRepository` — save, findById, findByProgramId, findByProgramIdAndPersonId, delete
- `ILoyaltyTransferRepository` — save, findById, delete (cascades to linked transactions)
- `PrismaLoyaltyProgramRepository`, `PrismaLoyaltyTransactionRepository`, `PrismaLoyaltyTransferRepository`

### API Routes

```
GET    /api/loyalty/programs              → ListLoyaltyPrograms
POST   /api/loyalty/programs              → CreateLoyaltyProgram
PUT    /api/loyalty/programs/[id]         → UpdateLoyaltyProgram
DELETE /api/loyalty/programs/[id]         → DeleteLoyaltyProgram

GET    /api/loyalty/programs/[id]/report  → GetLoyaltyProgramReport (query: personId?)

POST   /api/loyalty/transactions          → CreateLoyaltyTransaction (non-transfer types only)
PUT    /api/loyalty/transactions/[id]     → UpdateLoyaltyTransaction
DELETE /api/loyalty/transactions/[id]     → DeleteLoyaltyTransaction

POST   /api/loyalty/transfers             → CreateLoyaltyTransfer (creates transfer + 2 transactions)
DELETE /api/loyalty/transfers/[id]        → DeleteLoyaltyTransfer (cascades to both transactions)
```

---

## UI Layer

### `/loyalty` — Program List

- Person filter (reuses existing filter pattern from monthly-view)
- Cards grid: one card per program
  - Name, type badge, color accent
  - Current balance (points)
  - Total invested (R$)
  - Avg cost/1k pts
  - Warning badge if any points expiring within 90 days
- "Add Program" button
- Click card → `/loyalty/[programId]`

### `/loyalty/[programId]` — Program Detail

**Summary header:** balance, total invested, avg cost/1k pts, total redeemed, total expired, ROI %

**Transaction list** (newest first, person filter):

| Type | Columns shown |
|---|---|
| PURCHASE | Date, points, cost (R$), cost/1k pts, expires at |
| EARN | Date, points, description, expires at |
| BONUS | Date, points, description, expires at |
| REDEEM | Date, points, value received (R$), FIFO cost (R$), cost/1k pts, ROI % |
| TRANSFER_OUT | Date, points, destination program (from linked LoyaltyTransfer) |
| TRANSFER_IN | Date, points, source program, cost basis if provided (from linked LoyaltyTransfer) |
| EXPIRE | Date, points lost |
| ADJUSTMENT | Date, points (±), description |

- "Add Transaction" → form (non-transfer types)
- "Add Transfer" → separate form: from/to programs, points sent, points received, optional cost

---

## Testing

### Domain (TDD — mandatory)

- `LoyaltyProgram` entity: validation rules
- `LoyaltyTransfer` entity: pointsReceived >= pointsSent, costBrl > 0 if provided
- `LoyaltyTransaction` entity: validation rules per type; transferId required for TRANSFER_OUT/IN; transferId null for all other types
- `LoyaltyFifo` service:
  - PURCHASE → REDEEM: correct costPer1kPoints and ROI
  - Multiple purchase lots consumed in FIFO order
  - EARN/BONUS: free points, zero cost
  - TRANSFER_OUT consumes lots
  - TRANSFER_IN without costBrl: balance only, no lot
  - TRANSFER_IN with costBrl: lot created, cost flows to redemptions
  - EXPIRE: consumes lots, value = 0, roi = null
  - ADJUSTMENT positive: zero-cost lot
  - ADJUSTMENT negative: consumes lots
  - Redemption exceeding purchased lots (free points cover gap)
  - ROI = null when totalCostBrl = 0
  - Empty program

### Application

- `CreateLoyaltyTransfer`: atomically creates transfer + 2 transactions; rollback on failure
- `CreateLoyaltyTransaction`: rejects TRANSFER_OUT/IN types (must use CreateLoyaltyTransfer)
- `DeleteLoyaltyTransfer`: cascades to both linked transactions
- `GetLoyaltyProgramReport`: integrates LoyaltyFifo correctly

---

## Files to Create

```
src/domain/entities/LoyaltyProgram.ts
src/domain/entities/LoyaltyTransaction.ts
src/domain/entities/LoyaltyTransfer.ts
src/domain/services/LoyaltyFifo.ts
src/domain/repositories/ILoyaltyProgramRepository.ts
src/domain/repositories/ILoyaltyTransactionRepository.ts
src/domain/repositories/ILoyaltyTransferRepository.ts

src/application/useCases/loyalty/CreateLoyaltyProgram.ts
src/application/useCases/loyalty/UpdateLoyaltyProgram.ts
src/application/useCases/loyalty/DeleteLoyaltyProgram.ts
src/application/useCases/loyalty/ListLoyaltyPrograms.ts
src/application/useCases/loyalty/CreateLoyaltyTransaction.ts
src/application/useCases/loyalty/UpdateLoyaltyTransaction.ts
src/application/useCases/loyalty/DeleteLoyaltyTransaction.ts
src/application/useCases/loyalty/CreateLoyaltyTransfer.ts
src/application/useCases/loyalty/DeleteLoyaltyTransfer.ts
src/application/useCases/loyalty/GetLoyaltyProgramReport.ts

src/infrastructure/repositories/PrismaLoyaltyProgramRepository.ts
src/infrastructure/repositories/PrismaLoyaltyTransactionRepository.ts
src/infrastructure/repositories/PrismaLoyaltyTransferRepository.ts

src/app/loyalty/page.tsx
src/app/loyalty/[programId]/page.tsx
src/app/api/loyalty/programs/route.ts
src/app/api/loyalty/programs/[id]/route.ts
src/app/api/loyalty/programs/[id]/report/route.ts
src/app/api/loyalty/transactions/route.ts
src/app/api/loyalty/transactions/[id]/route.ts
src/app/api/loyalty/transfers/route.ts
src/app/api/loyalty/transfers/[id]/route.ts

prisma/migrations/<timestamp>_add_loyalty_tables/migration.sql

tests/domain/entities/LoyaltyProgram.test.ts
tests/domain/entities/LoyaltyTransaction.test.ts
tests/domain/entities/LoyaltyTransfer.test.ts
tests/domain/services/LoyaltyFifo.test.ts
tests/application/useCases/loyalty/CreateLoyaltyTransaction.test.ts
tests/application/useCases/loyalty/CreateLoyaltyTransfer.test.ts
tests/application/useCases/loyalty/GetLoyaltyProgramReport.test.ts
```
