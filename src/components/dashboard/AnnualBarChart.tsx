"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthSummary } from "@/domain/services/AnnualReport";
import { BALANCE_LINE_COLOR } from "@/lib/dashboardColors";

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

type Props = {
  months: MonthSummary[];
};

function formatBRLFull(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatBRLCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$ ${Math.round(abs / 1_000)}k`;
  return `${sign}R$ ${abs.toFixed(0)}`;
}

type TooltipEntry = { name: string; value: number; color: string };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg text-xs min-w-[160px]">
      <p className="text-muted-foreground font-medium mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.name}
          </span>
          <span className="text-foreground tabular-nums">{formatBRLFull(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function AnnualBarChart({ months }: Props) {
  const data = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Receita: m.income,
    Despesas: m.expenses,
    Saldo: m.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 24, left: 4, bottom: 0 }}
        barCategoryGap="38%"
      >
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatBRLCompact}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={68}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{
            fontSize: "12px",
            paddingTop: "14px",
            color: "hsl(var(--muted-foreground))",
          }}
        />
        <Bar dataKey="Receita" fill="hsl(var(--income))" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Bar dataKey="Despesas" fill="hsl(var(--expense))" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Line
          type="monotone"
          dataKey="Saldo"
          stroke={BALANCE_LINE_COLOR}
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 3, fill: BALANCE_LINE_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 4.5, fill: BALANCE_LINE_COLOR, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
