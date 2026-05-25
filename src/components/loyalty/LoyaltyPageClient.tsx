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
        <PageHeader
          eyebrow="Finanças"
          title="Programas de Milhas"
          description={programs.length > 0 ? `${programs.length} programas cadastrados` : undefined}
        />

        {programs.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo de Pontos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {programs.map((p) => (
                <div key={p.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-medium text-muted-foreground truncate">{p.name}</span>
                  </div>
                  <span className="text-xl font-semibold tabular-nums">
                    {(balances[p.id] ?? 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-muted-foreground">pontos</span>
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
