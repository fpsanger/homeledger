import type { MonthSummary } from "@/domain/services/AnnualReport";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

export function AnnualCard({ title, total, months, field }: Props) {
  const isBalance = field === "balance";

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 min-w-0">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p
          className={`text-2xl font-bold ${
            isBalance ? (total >= 0 ? "text-green-600" : "text-red-600") : ""
          }`}
        >
          {formatAmount(total)}
        </p>
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
                    className={`py-1 text-right font-medium ${
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
