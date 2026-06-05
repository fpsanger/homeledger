"use client";

import { formatDatePtBR } from "@/lib/format-date";

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
  return formatDatePtBR(iso);
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
    <div className="rounded-xl border overflow-x-auto">
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
