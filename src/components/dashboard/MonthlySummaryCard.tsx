import { TrendingUp, TrendingDown } from "lucide-react";

type Transaction = { type: string; amount: number };
type Installment = { amount: number };

type Props = {
  transactions: Transaction[];
  installments?: Installment[];
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export function MonthlySummaryCard({ transactions, installments = [] }: Props) {
  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const installmentExpenses = installments.reduce((s, i) => s + i.amount, 0);
  const expenses =
    transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0) +
    installmentExpenses;
  const balance = income - expenses;
  const isPositive = balance >= 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Balance row */}
      <div className="rounded-xl border bg-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            Saldo do Mês
          </p>
          <p
            className={`text-3xl font-bold tracking-tight amount-display ${
              isPositive ? "text-emerald-500" : "text-red-400"
            }`}
          >
            {formatAmount(balance)}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isPositive
              ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/8"
              : "border-red-400/20 text-red-400 bg-red-400/8"
          }`}
        >
          {isPositive ? "Positivo" : "Negativo"}
        </span>
      </div>

      {/* Supporting stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-l-4 border-l-emerald-600 p-4 flex items-center justify-between card-hover">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Receita
            </p>
            <p className="text-xl font-bold mt-1 amount-display">{formatAmount(income)}</p>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

        <div className="bg-card rounded-xl border border-l-4 border-l-red-500 p-4 flex items-center justify-between card-hover">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Despesas
            </p>
            <p className="text-xl font-bold mt-1 amount-display">{formatAmount(expenses)}</p>
          </div>
          <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}
