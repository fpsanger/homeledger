import { TrendingUp, TrendingDown, Scale } from "lucide-react";

type Transaction = { type: string; amount: number };
type Installment = { amount: number; isCanceled: boolean };

type Props = {
  transactions: Transaction[];
  installments?: Installment[];
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export function MonthlySummaryCard({ transactions, installments = [] }: Props) {
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const installmentExpenses = installments
    .filter((i) => !i.isCanceled)
    .reduce((s, i) => s + i.amount, 0);
  const expenses =
    transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0) +
    installmentExpenses;
  const balance = income - expenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-lg shadow-sm border border-l-4 border-l-green-500 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receita</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(income)}</p>
          </div>
          <span className="p-2 rounded-lg text-green-600 bg-green-50">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-l-4 border-l-red-400 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Despesas</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(expenses)}</p>
          </div>
          <span className="p-2 rounded-lg text-red-600 bg-red-50">
            <TrendingDown className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-l-4 border-l-slate-400 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatAmount(balance)}
            </p>
          </div>
          <span className="p-2 rounded-lg text-slate-600 bg-slate-50">
            <Scale className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
