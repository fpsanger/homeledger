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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthSummary } from "@/domain/services/AnnualReport";
import { INCOME_PERSON_SHADES } from "@/lib/dashboardColors";

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

function fmtPct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

type Person = { id: string; name: string };

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color: string;
  payload: Record<string, number | string>;
};

function CustomTooltip({
  active,
  payload,
  label,
  showRate,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  showRate?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rate = payload[0]?.payload?.rate as number | undefined;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-xs min-w-[160px]">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="text-foreground tabular-nums">{fmtFull(entry.value)}</span>
        </div>
      ))}
      {showRate && rate !== undefined && rate > 0 && (
        <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-border">
          <span className="text-muted-foreground">Taxa</span>
          <span className="text-foreground tabular-nums font-medium">{fmtPct(rate)}</span>
        </div>
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
  totalInvestments: number;
  people: Person[];
  globalPersonId: string;
};

export function InvestmentOverviewCard({ months, totalInvestments, people, globalPersonId }: Props) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const showPersonBreakdown = !globalPersonId && people.length > 1;

  const data = months.map((m) => {
    const rate = m.income > 0 ? (m.investments / m.income) * 100 : 0;
    if (showPersonBreakdown) {
      const row: Record<string, number | string> = { name: MONTH_NAMES[m.month - 1], rate };
      for (const p of people) {
        row[p.name] = m.investmentsByPerson[p.id] ?? 0;
      }
      return row;
    }
    return { name: MONTH_NAMES[m.month - 1], Investido: m.investments, rate };
  });

  const currentMonthData = months.find((m) => m.month === currentMonth);
  const currentRate =
    currentMonthData && currentMonthData.income > 0
      ? (currentMonthData.investments / currentMonthData.income) * 100
      : 0;

  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const annualRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Investimentos
        </CardDescription>
        <CardTitle className="text-lg font-semibold">Visão de Investimentos</CardTitle>
        <p className="text-xs text-muted-foreground">Investido por mês no ano</p>
      </CardHeader>
      <CardContent className="pt-0 pb-4 flex flex-col gap-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
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
              content={<CustomTooltip showRate />}
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
                    fill={INCOME_PERSON_SHADES[i % INCOME_PERSON_SHADES.length]}
                    fillOpacity={0.85}
                    radius={i === people.length - 1 ? [3, 3, 0, 0] : undefined}
                    maxBarSize={22}
                  />
                ))}
              </>
            ) : (
              <Bar
                dataKey="Investido"
                fill="hsl(var(--income))"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
              />
            )}
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Total investido</p>
            <p className="text-sm font-semibold tabular-nums">{fmtFull(totalInvestments)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Taxa este mês</p>
            <p className="text-sm font-semibold tabular-nums">{fmtPct(currentRate)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Média anual</p>
            <p className="text-sm font-semibold tabular-nums">{fmtPct(annualRate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
