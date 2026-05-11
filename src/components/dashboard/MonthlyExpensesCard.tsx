"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  if (abs >= 1_000_000) return `R$${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `R$${Math.round(abs / 1_000)}k`;
  return `R$${abs.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="font-semibold text-foreground tabular-nums">{fmtFull(payload[0].value)}</p>
    </div>
  );
}

type Props = { months: MonthSummary[]; totalExpenses: number };

export function MonthlyExpensesCard({ months, totalExpenses }: Props) {
  const data = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    value: m.expenses,
  }));

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Despesas Mensais no Ano
        </CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">
          {fmtFull(totalExpenses)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Total de despesas por mês no ano selecionado</p>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((entry, i) => {
                const intensity = maxVal > 0 ? entry.value / maxVal : 0;
                const opacity = 0.45 + intensity * 0.55;
                return <Cell key={i} fill={`hsl(15 75% 52%)`} fillOpacity={opacity} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
