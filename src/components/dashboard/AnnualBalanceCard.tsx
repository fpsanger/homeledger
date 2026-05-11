"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthSummary } from "@/domain/services/AnnualReport";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtFull(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtCompact(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$${Math.round(abs / 1_000)}k`;
  return `${sign}R$${abs.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      <p className={`font-semibold tabular-nums ${val >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
        {fmtSigned(val)}
      </p>
    </div>
  );
}

export function fmtSigned(v: number) {
  const sign = v > 0 ? "+" : "";
  return sign + fmtFull(v);
}

type ChartProps = { months: MonthSummary[] };

export function AnnualBalanceChart({ months }: ChartProps) {
  const data = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    value: m.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtCompact}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.value >= 0 ? "hsl(152 55% 42%)" : "hsl(0 65% 55%)"}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

type Props = { months: MonthSummary[]; totalBalance: number };

export function AnnualBalanceCard({ months, totalBalance }: Props) {
  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Balanço Anual
        </CardDescription>
        <CardTitle className={`text-2xl font-bold tabular-nums ${totalBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {fmtSigned(totalBalance)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Diferença entre receitas e despesas por mês</p>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <AnnualBalanceChart months={months} />
      </CardContent>
    </Card>
  );
}
