"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthSummary } from "@/domain/services/AnnualReport";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Props = {
  months: MonthSummary[];
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
      <BarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => formatBRL(v)} tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(value) => (typeof value === "number" ? formatBRL(value) : value)} />
        <Legend />
        <Bar dataKey="Receita" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Despesas" fill="#f87171" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Saldo" fill="#94a3b8" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
