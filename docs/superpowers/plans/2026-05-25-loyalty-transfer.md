# Loyalty Transfer Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/loyalty/transfers` page where users can record point transfers between loyalty programs with a bonus multiplier, and view the full transfer history.

**Architecture:** Backend infrastructure already exists (`CreateLoyaltyTransferUseCase`, `POST /api/loyalty/transfers`, `PrismaLoyaltyTransferRepository`). We add `findAll()` to the repo, a `ListLoyaltyTransfersUseCase`, a `GET` endpoint, and all UI components. The bonus percentage is UI-only — `pointsReceived = Math.round(pointsSent × (1 + bonus / 100))`.

**Tech Stack:** TypeScript, Next.js 14 App Router, Prisma, React, Tailwind CSS, Jest + ts-jest

---

### Task 1: Add `findAll()` to `ILoyaltyTransferRepository`

**Files:**
- Modify: `src/domain/repositories/ILoyaltyTransferRepository.ts`

- [ ] **Step 1: Add `findAll()` to the interface**

```typescript
import type { LoyaltyTransferRecord } from "../entities/LoyaltyTransfer";

export type { LoyaltyTransferRecord };

export interface ILoyaltyTransferRepository {
  save(transfer: LoyaltyTransferRecord): Promise<LoyaltyTransferRecord>;
  findById(id: string): Promise<LoyaltyTransferRecord | null>;
  findAll(): Promise<LoyaltyTransferRecord[]>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/repositories/ILoyaltyTransferRepository.ts
git commit -m "feat: add findAll to ILoyaltyTransferRepository"
```

---

### Task 2: Implement `findAll()` in `PrismaLoyaltyTransferRepository`

**Files:**
- Modify: `src/infrastructure/repositories/PrismaLoyaltyTransferRepository.ts`

- [ ] **Step 1: Add `findAll()` method**

Add this method to the class (after `findById`):

```typescript
async findAll(): Promise<LoyaltyTransferRecord[]> {
  return this.prisma.loyaltyTransfer.findMany({
    orderBy: { transferDate: "desc" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/repositories/PrismaLoyaltyTransferRepository.ts
git commit -m "feat: implement findAll in PrismaLoyaltyTransferRepository"
```

---

### Task 3: Create `ListLoyaltyTransfersUseCase`

**Files:**
- Create: `src/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.ts`
- Create: `tests/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.test.ts
import { listLoyaltyTransfersUseCase } from "../../../../src/application/use-cases/loyalty/ListLoyaltyTransfersUseCase";
import type { ILoyaltyTransferRepository, LoyaltyTransferRecord } from "../../../../src/domain/repositories/ILoyaltyTransferRepository";

const makeRepo = (transfers: LoyaltyTransferRecord[]): ILoyaltyTransferRepository => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn().mockResolvedValue(transfers),
  delete: jest.fn(),
});

const makeTransfer = (overrides = {}): LoyaltyTransferRecord => ({
  id: "t1",
  fromProgramId: "p1",
  toProgramId: "p2",
  pointsSent: 10000,
  pointsReceived: 20000,
  costBrl: null,
  transferDate: new Date("2026-05-25"),
  personId: null,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("listLoyaltyTransfersUseCase", () => {
  it("returns all transfers from repo", async () => {
    const transfers = [makeTransfer(), makeTransfer({ id: "t2" })];
    const repo = makeRepo(transfers);
    const result = await listLoyaltyTransfersUseCase(repo);
    expect(result).toEqual(transfers);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no transfers", async () => {
    const repo = makeRepo([]);
    const result = await listLoyaltyTransfersUseCase(repo);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.test.ts --no-coverage
```

Expected: FAIL — `listLoyaltyTransfersUseCase` not found.

- [ ] **Step 3: Implement the use case**

```typescript
// src/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.ts
import type { ILoyaltyTransferRepository, LoyaltyTransferRecord } from "../../../domain/repositories/ILoyaltyTransferRepository";

export async function listLoyaltyTransfersUseCase(
  transferRepo: ILoyaltyTransferRepository,
): Promise<LoyaltyTransferRecord[]> {
  return transferRepo.findAll();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.test.ts --no-coverage
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.ts tests/application/use-cases/loyalty/ListLoyaltyTransfersUseCase.test.ts
git commit -m "feat: add ListLoyaltyTransfersUseCase"
```

---

### Task 4: Add `GET /api/loyalty/transfers`

**Files:**
- Modify: `src/app/api/loyalty/transfers/route.ts`

- [ ] **Step 1: Add GET handler**

The existing file only has `POST`. Add `GET` above it:

```typescript
import { NextRequest } from "next/server";
import { createLoyaltyTransferUseCase } from "../../../../application/use-cases/loyalty/CreateLoyaltyTransferUseCase";
import { listLoyaltyTransfersUseCase } from "../../../../application/use-cases/loyalty/ListLoyaltyTransfersUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET() {
  try {
    const { loyaltyTransfer } = createRepositories();
    const transfers = await listLoyaltyTransfersUseCase(loyaltyTransfer);
    return Response.json({ transfers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.fromProgramId) return Response.json({ error: "fromProgramId is required" }, { status: 400 });
    if (!body.toProgramId) return Response.json({ error: "toProgramId is required" }, { status: 400 });
    if (body.fromProgramId === body.toProgramId) {
      return Response.json({ error: "fromProgramId and toProgramId must be different" }, { status: 400 });
    }
    if (typeof body.pointsSent !== "number" || body.pointsSent <= 0) {
      return Response.json({ error: "pointsSent must be a positive number" }, { status: 400 });
    }
    if (typeof body.pointsReceived !== "number" || body.pointsReceived < body.pointsSent) {
      return Response.json({ error: "pointsReceived must be >= pointsSent" }, { status: 400 });
    }
    if (!body.transferDate) return Response.json({ error: "transferDate is required" }, { status: 400 });

    const { loyaltyTransfer, loyaltyTransaction } = createRepositories();
    const result = await createLoyaltyTransferUseCase(
      {
        transferId: crypto.randomUUID(),
        outTxId: crypto.randomUUID(),
        inTxId: crypto.randomUUID(),
        fromProgramId: body.fromProgramId,
        toProgramId: body.toProgramId,
        pointsSent: body.pointsSent,
        pointsReceived: body.pointsReceived,
        costBrl: body.costBrl ?? null,
        transferDate: new Date(body.transferDate),
        personId: body.personId ?? null,
        description: body.description ?? null,
      },
      loyaltyTransfer,
      loyaltyTransaction,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/loyalty/transfers/route.ts
git commit -m "feat: add GET /api/loyalty/transfers and same-program validation"
```

---

### Task 5: Create `LoyaltyTransferForm` component

**Files:**
- Create: `src/components/loyalty/LoyaltyTransferForm.tsx`

- [ ] **Step 1: Create the form component**

```typescript
// src/components/loyalty/LoyaltyTransferForm.tsx
"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";

type Program = { id: string; name: string };

type Props = {
  programs: Program[];
  onSuccess: () => void;
};

export function LoyaltyTransferForm({ programs, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [fromProgramId, setFromProgramId] = useState(programs[0]?.id ?? "");
  const [toProgramId, setToProgramId] = useState(programs[1]?.id ?? "");
  const [pointsSent, setPointsSent] = useState("");
  const [bonusPercent, setBonusPercent] = useState("0");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sentNum = Number(pointsSent) || 0;
  const bonusNum = Number(bonusPercent) || 0;
  const pointsReceived = sentNum > 0 ? Math.round(sentNum * (1 + bonusNum / 100)) : 0;

  const destinationPrograms = programs.filter((p) => p.id !== fromProgramId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fromProgramId === toProgramId) {
      setError("Programa de origem e destino devem ser diferentes.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromProgramId,
          toProgramId,
          pointsSent: Number(pointsSent),
          pointsReceived,
          transferDate: date,
          description: description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao registrar transferência.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-from">De</label>
          <select
            id="transfer-from"
            value={fromProgramId}
            onChange={(e) => {
              setFromProgramId(e.target.value);
              if (toProgramId === e.target.value) {
                const other = programs.find((p) => p.id !== e.target.value);
                setToProgramId(other?.id ?? "");
              }
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-to">Para</label>
          <select
            id="transfer-to"
            value={toProgramId}
            onChange={(e) => setToProgramId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {destinationPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-points">Pontos enviados</label>
          <input
            id="transfer-points"
            type="number"
            min="1"
            value={pointsSent}
            onChange={(e) => setPointsSent(e.target.value)}
            required
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-bonus">Bônus (%)</label>
          <input
            id="transfer-bonus"
            type="number"
            min="0"
            step="1"
            value={bonusPercent}
            onChange={(e) => setBonusPercent(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-md bg-muted px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pontos recebidos</span>
        <span className="font-semibold text-base">{pointsReceived > 0 ? pointsReceived.toLocaleString("pt-BR") : "—"}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Data</label>
        <DatePicker value={date} onChange={setDate} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="transfer-desc">Descrição</label>
        <input
          id="transfer-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Registrar Transferência"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/loyalty/LoyaltyTransferForm.tsx
git commit -m "feat: add LoyaltyTransferForm component"
```

---

### Task 6: Create `LoyaltyTransferDialog` component

**Files:**
- Create: `src/components/loyalty/LoyaltyTransferDialog.tsx`

- [ ] **Step 1: Create the dialog component**

```typescript
// src/components/loyalty/LoyaltyTransferDialog.tsx
"use client";

import { Dialog } from "@/components/ui/dialog";
import { LoyaltyTransferForm } from "./LoyaltyTransferForm";

type Program = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programs: Program[];
};

export function LoyaltyTransferDialog({ open, onClose, onSuccess, programs }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Nova Transferência">
      <LoyaltyTransferForm programs={programs} onSuccess={onSuccess} />
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/loyalty/LoyaltyTransferDialog.tsx
git commit -m "feat: add LoyaltyTransferDialog component"
```

---

### Task 7: Create `LoyaltyTransferTable` component

**Files:**
- Create: `src/components/loyalty/LoyaltyTransferTable.tsx`

- [ ] **Step 1: Create the table component**

```typescript
// src/components/loyalty/LoyaltyTransferTable.tsx
"use client";

type Program = { id: string; name: string };

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

type Props = {
  transfers: Transfer[];
  programs: Program[];
};

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
}

function formatPts(n: number) {
  return n.toLocaleString("pt-BR");
}

function bonusPercent(sent: number, received: number) {
  if (sent <= 0) return "0%";
  const pct = Math.round(((received / sent) - 1) * 100);
  return `${pct}%`;
}

export function LoyaltyTransferTable({ transfers, programs }: Props) {
  const nameMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  if (transfers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhuma transferência registrada ainda.
      </p>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">De</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Para</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Enviados</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bônus</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Recebidos</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={t.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(t.transferDate)}
              </td>
              <td className="px-4 py-3 font-medium">{nameMap[t.fromProgramId] ?? t.fromProgramId}</td>
              <td className="px-4 py-3 font-medium">{nameMap[t.toProgramId] ?? t.toProgramId}</td>
              <td className="px-4 py-3 text-right font-mono">{formatPts(t.pointsSent)}</td>
              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                +{bonusPercent(t.pointsSent, t.pointsReceived)}
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold">{formatPts(t.pointsReceived)}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{t.description ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/loyalty/LoyaltyTransferTable.tsx
git commit -m "feat: add LoyaltyTransferTable component"
```

---

### Task 8: Create `TransfersPageClient` component

**Files:**
- Create: `src/components/loyalty/TransfersPageClient.tsx`

- [ ] **Step 1: Create the client component**

```typescript
// src/components/loyalty/TransfersPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyTransferDialog } from "./LoyaltyTransferDialog";
import { LoyaltyTransferTable } from "./LoyaltyTransferTable";

type Program = { id: string; name: string };

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

type Props = {
  transfers: Transfer[];
  programs: Program[];
};

export function TransfersPageClient({ transfers, programs }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Milhas"
        title="Transferências"
        description={transfers.length > 0 ? `${transfers.length} transferências registradas` : undefined}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Nova Transferência
        </button>
      </PageHeader>

      <LoyaltyTransferDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        programs={programs}
      />

      <LoyaltyTransferTable transfers={transfers} programs={programs} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/loyalty/TransfersPageClient.tsx
git commit -m "feat: add TransfersPageClient component"
```

---

### Task 9: Create `/loyalty/transfers` page

**Files:**
- Create: `src/app/loyalty/transfers/page.tsx`

- [ ] **Step 1: Create the server page**

```typescript
// src/app/loyalty/transfers/page.tsx
import { TransfersPageClient } from "@/components/loyalty/TransfersPageClient";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

type Program = { id: string; name: string };

async function getTransfers(): Promise<Transfer[]> {
  const res = await fetch(`${BASE}/api/loyalty/transfers`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transfers ?? [];
}

async function getPrograms(): Promise<Program[]> {
  const res = await fetch(`${BASE}/api/loyalty/programs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.programs ?? [];
}

export default async function LoyaltyTransfersPage() {
  const [transfers, programs] = await Promise.all([getTransfers(), getPrograms()]);
  return <TransfersPageClient transfers={transfers} programs={programs} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/loyalty/transfers/page.tsx
git commit -m "feat: add /loyalty/transfers page"
```

---

### Task 10: Add TopNav link

**Files:**
- Modify: `src/components/layout/TopNav.tsx`

- [ ] **Step 1: Add "Transferências" link to navLinks**

Replace the `navLinks` array:

```typescript
const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transações" },
  { href: "/installments", label: "Parcelas" },
  { href: "/credit-cards", label: "Cartões de Crédito" },
  { href: "/loyalty", label: "Milhas" },
  { href: "/loyalty/transfers", label: "Transferências" },
  { href: "/categories", label: "Categorias" },
  { href: "/people", label: "Pessoas" },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "feat: add Transferências link to TopNav"
```

---

### Task 11: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all existing tests pass + new `ListLoyaltyTransfersUseCase` tests pass.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v ".next"
```

Expected: no errors related to loyalty transfer files.
