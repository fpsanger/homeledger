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
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 shadow-xl text-xs min-w-[160px]">
      <p className="text-zinc-500 font-medium mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.name}
          </span>
          <span className="text-zinc-200 tabular-nums">{formatBRLFull(entry.value)}</span>
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
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.04)" }} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{
            fontSize: "12px",
            paddingTop: "14px",
            color: "hsl(var(--muted-foreground))",
          }}
        />
        <Bar dataKey="Receita" fill="hsl(160 35% 38%)" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Bar dataKey="Despesas" fill="hsl(0 40% 42%)" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Line
          type="monotone"
          dataKey="Saldo"
          stroke="hsl(215 55% 62%)"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(215 55% 62%)", strokeWidth: 0 }}
          activeDot={{ r: 4.5, fill: "hsl(215 65% 72%)", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
