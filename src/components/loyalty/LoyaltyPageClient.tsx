"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { LoyaltyProgramList } from "./LoyaltyProgramList";
import { LoyaltyProgramCreateDialog } from "./LoyaltyProgramCreateDialog";
import { LoyaltyTransferDialog } from "./LoyaltyTransferDialog";
import { LoyaltyTransferTable } from "./LoyaltyTransferTable";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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

function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 flex flex-col justify-center gap-1">
      <span className="text-lg font-semibold tabular-nums tracking-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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
        <PageHeader
          eyebrow="Finanças"
          title="Programas de Milhas"
          description={programs.length > 0 ? `${programs.length} programas cadastrados` : undefined}
        >
          <Button onClick={() => setOpenTransfer(true)} className="w-full sm:w-auto shrink-0 gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Transferir entre parceiros
          </Button>
        </PageHeader>

        {programs.length > 0 && (
          <>
            <div className="rounded-xl border bg-card overflow-hidden grid sm:grid-cols-[1.3fr,1fr,1fr,1fr] divide-y sm:divide-y-0 sm:divide-x">
              <div className="p-5 flex flex-col gap-1 justify-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total de Pontos</span>
                <span className="text-4xl font-semibold tabular-nums tracking-tight text-primary leading-none">
                  {totals.points.toLocaleString("pt-BR")}
                </span>
              </div>
              <SecondaryStat label="Total Investido" value={formatBrl(totals.invested)} />
              <SecondaryStat label="Custo Médio/1k pts" value={blendedCostPer1k > 0 ? formatBrl(blendedCostPer1k) : "—"} />
              <SecondaryStat
                label="ROI Geral"
                value={totals.redeemed === 0 ? "Nenhum resgate" : blendedRoi != null ? `${blendedRoi.toFixed(1)}%` : "—"}
              />
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo por Programa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {programs.map((p) => {
                const s = summaries[p.id];
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border bg-card p-4 flex flex-col gap-1.5 min-w-0"
                    style={{ background: `linear-gradient(135deg, ${p.color}18 0%, transparent 70%)` }}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-medium text-muted-foreground truncate">{p.name}</span>
                    </span>
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
                );
              })}
            </div>
          </>
        )}

        <LoyaltyProgramCreateDialog open={openProgram} onClose={() => setOpenProgram(false)} onSuccess={handleProgramSuccess} />
        <LoyaltyProgramList programs={programs} onAdd={() => setOpenProgram(true)} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico de Transferências
        </h2>

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
