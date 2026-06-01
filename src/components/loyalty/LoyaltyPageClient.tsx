"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoyaltyProgramList } from "./LoyaltyProgramList";
import { LoyaltyProgramCreateDialog } from "./LoyaltyProgramCreateDialog";
import { LoyaltyTransferDialog } from "./LoyaltyTransferDialog";
import { LoyaltyTransferTable } from "./LoyaltyTransferTable";
import { PageHeader } from "@/components/ui/page-header";
type Program = {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

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
  programs: Program[];
  transfers: Transfer[];
  balances: Record<string, number>;
};

export function LoyaltyPageClient({ programs, transfers, balances }: Props) {
  const router = useRouter();
  const [openProgram, setOpenProgram] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);

  function handleProgramSuccess() {
    setOpenProgram(false);
    router.refresh();
  }

  function handleTransferSuccess() {
    setOpenTransfer(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            eyebrow="Finanças"
            title="Programas de Milhas"
            description={programs.length > 0 ? `${programs.length} programas cadastrados` : undefined}
          />
        </div>

        {programs.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo de Pontos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {programs.map((p) => (
                <div key={p.id} className="rounded-xl border bg-card overflow-hidden flex">
                  <div className="w-1 shrink-0" style={{ backgroundColor: p.color }} />
                  <div
                    className="p-4 flex flex-col gap-1.5 flex-1 min-w-0"
                    style={{ background: `linear-gradient(135deg, ${p.color}18 0%, transparent 70%)` }}
                  >
                    <span className="text-xs font-medium text-muted-foreground truncate">{p.name}</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight leading-none">
                      {(balances[p.id] ?? 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-muted-foreground">pontos</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <LoyaltyProgramCreateDialog open={openProgram} onClose={() => setOpenProgram(false)} onSuccess={handleProgramSuccess} />
        <LoyaltyProgramList programs={programs} onAdd={() => setOpenProgram(true)} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Transferências
          </h2>
          <button
            type="button"
            onClick={() => setOpenTransfer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Transferências entre parceiros
          </button>
        </div>

        <LoyaltyTransferDialog
          open={openTransfer}
          onClose={() => setOpenTransfer(false)}
          onSuccess={handleTransferSuccess}
          programs={programs}
        />
        <LoyaltyTransferTable transfers={transfers} programs={programs} />
      </div>
    </div>
  );
}
