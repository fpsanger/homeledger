import type { MonthSummary } from "@/domain/services/AnnualReport";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

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

const FIELD_CONFIG = {
  income: {
    icon: TrendingUp,
    borderClass: "border-l-4 border-l-green-500",
    iconClass: "text-green-600 bg-green-50",
  },
  expenses: {
    icon: TrendingDown,
    borderClass: "border-l-4 border-l-red-400",
    iconClass: "text-red-600 bg-red-50",
  },
  balance: {
    icon: Scale,
    borderClass: "border-l-4 border-l-slate-400",
    iconClass: "text-slate-600 bg-slate-50",
  },
};

export function AnnualCard({ title, total, months, field }: Props) {
  const isBalance = field === "balance";
  const config = FIELD_CONFIG[field];
  const Icon = config.icon;

  return (
    <div
      className={`bg-card rounded-lg shadow-sm border ${config.borderClass} p-4 flex flex-col gap-3 min-w-0`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              isBalance ? (total >= 0 ? "text-green-600" : "text-red-600") : "text-foreground"
            }`}
          >
            {formatAmount(total)}
          </p>
        </div>
        <span className={`p-2 rounded-lg ${config.iconClass}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>

      <div className="border-t pt-2">
        <table className="w-full text-sm">
          <tbody>
            {months.map((m) => {
              const value = m[field];
              return (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-1 text-muted-foreground">{MONTH_NAMES[m.month - 1]}</td>
                  <td
                    className={`py-1 text-right font-medium tabular-nums ${
                      isBalance ? (value >= 0 ? "text-green-600" : "text-red-600") : ""
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
    </div>
  );
}
