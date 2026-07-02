import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  title: string;
  total: number;
  months: MonthSummary[];
  field: "income" | "expenses" | "balance";
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

const FIELD_ICON = {
  income: TrendingUp,
  expenses: TrendingDown,
  balance: Scale,
};

export function AnnualCard({ title, total, months, field }: Props) {
  const isBalance = field === "balance";
  const Icon = FIELD_ICON[field];

  return (
    <Card className="card-hover flex flex-col gap-0 min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex flex-col gap-1.5">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tracking-tight tabular-nums ${
              isBalance ? (total >= 0 ? "amount-positive" : "amount-negative") : "text-foreground"
            }`}
          >
            {formatAmount(total)}
          </CardTitle>
        </div>
        <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="border-t border-border pt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {months.map((m) => {
                const value = m[field];
                return (
                  <tr key={m.month} className="border-b border-border last:border-0">
                    <td className="py-1 text-muted-foreground">{MONTH_NAMES[m.month - 1]}</td>
                    <td
                      className={`py-1 text-right font-medium tabular-nums ${
                        isBalance ? (value >= 0 ? "amount-positive" : "amount-negative") : ""
                      }`}
                    >
                      {formatAmount(value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
