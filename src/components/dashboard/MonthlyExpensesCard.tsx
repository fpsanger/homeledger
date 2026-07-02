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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthSummary } from "@/domain/services/AnnualReport";
import { EXPENSE_PERSON_SHADES } from "@/lib/dashboardColors";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function fmtFull(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtCompact(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `R$${Math.round(abs / 1_000)}k`;
  return `R$${abs.toFixed(0)}`;
}

type Person = { id: string; name: string };

type TooltipPayloadEntry = { name: string; value: number; color: string };

function CustomTooltip({
  active,
  payload,
  label,
  showPersonBreakdown,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  showPersonBreakdown?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs min-w-[140px]">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {showPersonBreakdown ? (
        payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
            <span className="text-foreground tabular-nums">{fmtFull(entry.value)}</span>
          </div>
        ))
      ) : (
        <p className="font-semibold text-foreground tabular-nums">{fmtFull(payload[0].value)}</p>
      )}
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
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
  totalExpenses: number;
  people?: Person[];
  globalPersonId?: string;
};

export function MonthlyExpensesCard({ months, totalExpenses, people = [], globalPersonId = "" }: Props) {
  const showPersonBreakdown = !globalPersonId && people.length > 1;

  const data = months.map((m) => {
    if (showPersonBreakdown) {
      const row: Record<string, number | string> = { name: MONTH_NAMES[m.month - 1] };
      for (const p of people) {
        row[p.name] = m.expensesByPerson[p.id] ?? 0;
      }
      return row;
    }
    return { name: MONTH_NAMES[m.month - 1], value: m.expenses };
  });

  const maxVal = showPersonBreakdown ? 1 : Math.max(...months.map((m) => m.expenses), 1);

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Despesas Mensais no Ano
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
          {fmtFull(totalExpenses)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Total de despesas por mês no ano selecionado
        </p>
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
            <Tooltip
              content={<CustomTooltip showPersonBreakdown={showPersonBreakdown} />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            />
            {showPersonBreakdown ? (
              <>
                <Legend content={<CustomLegend />} />
                {people.map((p, i) => (
                  <Bar
                    key={p.id}
                    dataKey={p.name}
                    stackId="a"
                    fill={EXPENSE_PERSON_SHADES[i % EXPENSE_PERSON_SHADES.length]}
                    fillOpacity={0.85}
                    radius={i === people.length - 1 ? [4, 4, 0, 0] : undefined}
                    maxBarSize={28}
                  />
                ))}
              </>
            ) : (
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {months.map((m, i) => {
                  const intensity = maxVal > 0 ? m.expenses / maxVal : 0;
                  const opacity = 0.45 + intensity * 0.55;
                  return <Cell key={i} fill="hsl(var(--expense))" fillOpacity={opacity} />;
                })}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
