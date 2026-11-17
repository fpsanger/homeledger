"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const pct = Math.round((received / sent - 1) * 100);
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
    <>
      <div className="hidden md:block rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-left px-4 py-3 font-medium text-muted-foreground h-auto">
                Data
              </TableHead>
              <TableHead className="text-left px-4 py-3 font-medium text-muted-foreground h-auto">
                De
              </TableHead>
              <TableHead className="text-left px-4 py-3 font-medium text-muted-foreground h-auto">
                Para
              </TableHead>
              <TableHead className="text-right px-4 py-3 font-medium text-muted-foreground h-auto">
                Enviados
              </TableHead>
              <TableHead className="text-right px-4 py-3 font-medium text-muted-foreground h-auto">
                Bônus
              </TableHead>
              <TableHead className="text-right px-4 py-3 font-medium text-muted-foreground h-auto">
                Recebidos
              </TableHead>
              <TableHead className="text-left px-4 py-3 font-medium text-muted-foreground h-auto">
                Descrição
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(t.transferDate)}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium">
                  {nameMap[t.fromProgramId] ?? t.fromProgramId}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium">
                  {nameMap[t.toProgramId] ?? t.toProgramId}
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-mono">
                  {formatPts(t.pointsSent)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                  +{bonusPercent(t.pointsSent, t.pointsReceived)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-mono font-semibold">
                  {formatPts(t.pointsReceived)}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                  {t.description ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden flex flex-col gap-2">
        {transfers.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">
                {nameMap[t.fromProgramId] ?? t.fromProgramId} →{" "}
                {nameMap[t.toProgramId] ?? t.toProgramId}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                {formatDate(t.transferDate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono text-muted-foreground">{formatPts(t.pointsSent)} pts</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                +{bonusPercent(t.pointsSent, t.pointsReceived)}
              </span>
              <span className="font-mono font-semibold">{formatPts(t.pointsReceived)} pts</span>
            </div>
            {t.description && (
              <p className="text-xs text-muted-foreground border-t pt-2">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
