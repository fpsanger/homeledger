"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart2 } from "lucide-react";
import { CATEGORY_SHADES } from "@/lib/dashboardColors";
import { AccessibleChart } from "./AccessibleChart";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string | null;
};

type Installment = {
  id: string;
  amount: number;
  categoryId: string | null;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

type Props = {
  transactions: Transaction[];
  installments?: Installment[];
  categories: Category[];
};

const TOP_N = 7;

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type TooltipEntry = { name: string; value: number; payload: { pct: number } };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: extra } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{name}</p>
      <p className="text-foreground tabular-nums">{fmt(value)}</p>
      <p className="text-muted-foreground mt-0.5">{extra.pct.toFixed(1)}% do total</p>
    </div>
  );
}

export function CategoryBreakdownChart({ transactions, installments = [], categories }: Props) {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const grouped: Record<string, number> = {};
  for (const t of transactions.filter((t) => t.type === "EXPENSE")) {
    const label = t.categoryId ? (catById[t.categoryId]?.name ?? "Outro") : "Sem categoria";
    grouped[label] = (grouped[label] ?? 0) + t.amount;
  }
  for (const i of installments) {
    const label = i.categoryId ? (catById[i.categoryId]?.name ?? "Outro") : "Sem categoria";
    grouped[label] = (grouped[label] ?? 0) + i.amount;
  }

  const sorted = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <BarChart2 className="w-8 h-8 opacity-30" />
        <p className="text-sm">Sem dados de despesas neste mês</p>
      </div>
    );
  }

  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  if (rest.length > 0) {
    const outrosTotal = rest.reduce((s, e) => s + e.value, 0);
    top.push({ name: "Outros", value: outrosTotal });
  }

  const total = top.reduce((s, e) => s + e.value, 0);
  const data = top.map((e) => ({ ...e, pct: total > 0 ? (e.value / total) * 100 : 0 }));

  const barHeight = 32;
  const chartHeight = data.length * barHeight + 16;

  return (
    <AccessibleChart
      summary={data.map((d) => (
        <li key={d.name}>
          {d.name}: {fmt(d.value)} ({d.pct.toFixed(0)}% do total)
        </li>
      ))}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barSize={14}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_SHADES[index % CATEGORY_SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AccessibleChart>
  );
}
