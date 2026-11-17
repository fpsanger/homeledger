"use client";

import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { maskCurrency } from "@/lib/maskCurrency";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$${Math.round(abs / 1_000)}k`;
  return `${sign}R$${abs.toFixed(0)}`;
}

function Amount({ value, className }: { value: number; className?: string }) {
  const { hidden } = usePrivacy();
  return (
    <span className={className}>
      <span className="sm:hidden">{maskCurrency(formatCompact(value), hidden)}</span>
      <span className="hidden sm:inline">{maskCurrency(formatAmount(value), hidden)}</span>
    </span>
  );
}

type StatProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  valueClassName?: string;
};

function AnnualStat({ icon: Icon, label, value, valueClassName }: StatProps) {
  const { hidden } = usePrivacy();
  return (
    <div className="flex items-start justify-between gap-2 min-w-0">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </span>
        <span
          className={cn(
            "text-xl sm:text-2xl font-semibold tracking-tight tabular-nums",
            valueClassName,
          )}
        >
          {maskCurrency(formatAmount(value), hidden)}
        </span>
      </div>
      <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  );
}

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportCards({ report }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-border">
        <AnnualStat icon={TrendingUp} label="Receita" value={report.totalIncome} />
        <AnnualStat icon={TrendingDown} label="Despesas" value={report.totalExpenses} />
        <AnnualStat
          icon={Scale}
          label="Saldo"
          value={report.totalBalance}
          valueClassName={report.totalBalance >= 0 ? "amount-positive" : "amount-negative"}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-left py-1.5 font-medium text-xs text-muted-foreground uppercase tracking-wide h-auto px-0">
                Mês
              </TableHead>
              <TableHead className="text-right py-1.5 font-medium text-xs text-muted-foreground uppercase tracking-wide h-auto px-0">
                Receita
              </TableHead>
              <TableHead className="text-right py-1.5 font-medium text-xs text-muted-foreground uppercase tracking-wide h-auto px-0">
                Despesas
              </TableHead>
              <TableHead className="text-right py-1.5 font-medium text-xs text-muted-foreground uppercase tracking-wide h-auto px-0">
                Saldo
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.months.map((m) => (
              <TableRow key={m.month} className="border-border">
                <TableCell className="py-1.5 text-muted-foreground px-0">
                  {MONTH_NAMES[m.month - 1]}
                </TableCell>
                <TableCell className="py-1.5 text-right tabular-nums px-0">
                  <Amount value={m.income} />
                </TableCell>
                <TableCell className="py-1.5 text-right tabular-nums px-0">
                  <Amount value={m.expenses} />
                </TableCell>
                <TableCell
                  className={`px-0 py-1.5 text-right font-medium tabular-nums ${
                    m.balance >= 0 ? "amount-positive" : "amount-negative"
                  }`}
                >
                  <Amount value={m.balance} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
