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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthSummary } from "@/domain/services/AnnualReport";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// income shades (greens), expense shades (oranges/reds)
const INCOME_COLORS = [
  "hsl(152 55% 38%)",
  "hsl(107, 55%, 25%)",
  "hsl(120, 67%, 43%)",
  "hsl(165 50% 55%)",
];
const EXPENSE_COLORS = [
  "hsl(15 70% 50%)",
  "hsl(35 70% 50%)",
  "hsl(340 55% 50%)",
  "hsl(25 65% 55%)",
];

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

type Person = { id: string; name: string };

type TooltipPayloadEntry = { name: string; value: number; color: string };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-xs min-w-[150px]">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="text-foreground tabular-nums">{fmtFull(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  months: MonthSummary[];
  people?: Person[];
  globalPersonId?: string;
};

export function IncomeExpenseBalanceCard({ months, people = [], globalPersonId = "" }: Props) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const showPersonBreakdown = !globalPersonId && people.length > 1;

  const last6 = months
    .filter((m) => m.month <= currentMonth || months[0]?.month > currentMonth)
    .slice(-6);

  const data = last6.map((m) => {
    const base = {
      name: MONTH_NAMES[m.month - 1],
      Balanço: m.balance,
    };
    if (showPersonBreakdown) {
      const row: Record<string, number | string> = { ...base };
      for (const p of people) {
        row[`R:${p.name}`] = m.incomeByPerson[p.id] ?? 0;
        row[`D:${p.name}`] = m.expensesByPerson[p.id] ?? 0;
      }
      return row;
    }
    return { ...base, Receita: m.income, Despesa: m.expenses };
  });

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Receita, Despesa e Balanço
        </CardDescription>
        <CardTitle className="text-lg font-semibold">Visão Comparativa</CardTitle>
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
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
            <Legend content={<CustomLegend />} />

            {showPersonBreakdown ? (
              <>
                {people.map((p, i) => (
                  <Bar
                    key={`income-${p.id}`}
                    dataKey={`R:${p.name}`}
                    name={`Receita ${p.name}`}
                    stackId="income"
                    fill={INCOME_COLORS[i % INCOME_COLORS.length]}
                    fillOpacity={0.85}
                    radius={i === people.length - 1 ? [3, 3, 0, 0] : undefined}
                    maxBarSize={22}
                  />
                ))}
                {people.map((p, i) => (
                  <Bar
                    key={`expense-${p.id}`}
                    dataKey={`D:${p.name}`}
                    name={`Despesa ${p.name}`}
                    stackId="expense"
                    fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
                    fillOpacity={0.85}
                    radius={i === people.length - 1 ? [3, 3, 0, 0] : undefined}
                    maxBarSize={22}
                  />
                ))}
              </>
            ) : (
              <>
                <Bar
                  dataKey="Receita"
                  fill="hsl(152 50% 40%)"
                  fillOpacity={0.85}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="Despesa"
                  fill="hsl(15 70% 50%)"
                  fillOpacity={0.85}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
              </>
            )}
            <Line
              type="monotone"
              dataKey="Balanço"
              stroke="hsl(215 60% 60%)"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(215 60% 60%)", strokeWidth: 0 }}
              activeDot={{ r: 4, fill: "hsl(215 70% 70%)", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
