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

type Summary = {
  currentBalance: number;
  totalInvested: number;
  totalPurchasedPoints: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
};

type Props = {
  programs: Program[];
  transfers: Transfer[];
  summaries: Record<string, Summary>;
  personId?: string;
};

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function GlobalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

export function LoyaltyPageClient({ programs, transfers, summaries, personId }: Props) {
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

  const totals = programs.reduce(
    (acc, p) => {
      const s = summaries[p.id];
      if (!s) return acc;
      acc.points += s.currentBalance;
      acc.invested += s.totalInvested;
      acc.purchasedPoints += s.totalPurchasedPoints;
      acc.redeemed += s.totalValueRedeemed;
      return acc;
    },
    { points: 0, invested: 0, purchasedPoints: 0, redeemed: 0 },
  );
  const blendedCostPer1k = totals.purchasedPoints > 0 ? (totals.invested / totals.purchasedPoints) * 1000 : 0;
  const blendedRoi = totals.invested > 0 ? ((totals.redeemed - totals.invested) / totals.invested) * 100 : null;

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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo Geral</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <GlobalStat label="Total de Pontos" value={totals.points.toLocaleString("pt-BR")} />
              <GlobalStat label="Total Investido" value={formatBrl(totals.invested)} />
              <GlobalStat label="Custo Médio/1k pts" value={blendedCostPer1k > 0 ? formatBrl(blendedCostPer1k) : "—"} />
              <GlobalStat label="ROI Geral" value={totals.redeemed === 0 ? "Nenhum resgate" : blendedRoi != null ? `${blendedRoi.toFixed(1)}%` : "—"} />
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo por Programa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {programs.map((p) => {
                const s = summaries[p.id];
                return (
                  <div key={p.id} className="rounded-xl border bg-card overflow-hidden flex">
                    <div className="w-1 shrink-0" style={{ backgroundColor: p.color }} />
                    <div
                      className="p-4 flex flex-col gap-1.5 flex-1 min-w-0"
                      style={{ background: `linear-gradient(135deg, ${p.color}18 0%, transparent 70%)` }}
                    >
                      <span className="text-xs font-medium text-muted-foreground truncate">{p.name}</span>
                      <span className="text-2xl font-bold tabular-nums tracking-tight leading-none">
                        {(s?.currentBalance ?? 0).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-xs text-muted-foreground">pontos</span>
                      <span className="text-xs text-muted-foreground pt-1 border-t mt-1">
                        Custo/1k pts: {s && s.avgCostPer1kPoints > 0 ? formatBrl(s.avgCostPer1kPoints) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Investido: {formatBrl(s?.totalInvested ?? 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
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
          personId={personId}
        />
        <LoyaltyTransferTable transfers={transfers} programs={programs} />
      </div>
    </div>
  );
}
