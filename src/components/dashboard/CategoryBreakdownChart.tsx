"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string | null;
};

type Installment = {
  id: string;
  amount: number;
  isCanceled: boolean;
  categoryId: string | null;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
};

type Props = {
  transactions: Transaction[];
  installments?: Installment[];
  categories: Category[];
};

const COLORS = [
  "hsl(158, 60%, 36%)",
  "hsl(215, 60%, 52%)",
  "hsl(38, 85%, 55%)",
  "hsl(270, 50%, 58%)",
  "hsl(0, 65%, 55%)",
  "hsl(185, 55%, 42%)",
  "hsl(330, 55%, 55%)",
  "hsl(90, 45%, 45%)",
];

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CategoryBreakdownChart({ transactions, installments = [], categories }: Props) {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const expenses = transactions.filter((t) => t.type === "EXPENSE");

  const grouped: Record<string, number> = {};
  for (const t of expenses) {
    const label = t.categoryId ? (catById[t.categoryId]?.name ?? "Outro") : "Sem categoria";
    grouped[label] = (grouped[label] ?? 0) + t.amount;
  }
  for (const i of installments.filter((i) => !i.isCanceled)) {
    const label = i.categoryId ? (catById[i.categoryId]?.name ?? "Outro") : "Sem categoria";
    grouped[label] = (grouped[label] ?? 0) + i.amount;
  }

  const data = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <PieChartIcon className="w-8 h-8 opacity-30" />
        <p className="text-sm">Sem dados de despesas neste mês</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-full sm:w-64 h-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => (typeof value === "number" ? fmt(value) : String(value))}
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2 w-full min-w-0">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
            <span className="font-medium tabular-nums shrink-0">{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
