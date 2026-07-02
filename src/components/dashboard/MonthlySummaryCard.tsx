import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

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
      <Card className="p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            Saldo do Mês
          </p>
          <p
            className={`text-3xl font-semibold tracking-tight tabular-nums ${
              isPositive ? "amount-positive" : "amount-negative"
            }`}
          >
            {formatAmount(balance)}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isPositive
              ? "border-income/20 amount-positive bg-income/8"
              : "border-expense/20 amount-negative bg-expense/8"
          }`}
        >
          {isPositive ? "Positivo" : "Negativo"}
        </span>
      </Card>

      {/* Supporting stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Receita
            </p>
            <p className="text-xl font-semibold tracking-tight tabular-nums mt-1 amount-positive">
              {formatAmount(income)}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
        </Card>

        <Card className="card-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Despesas
            </p>
            <p className="text-xl font-semibold tracking-tight tabular-nums mt-1 amount-negative">
              {formatAmount(expenses)}
            </p>
          </div>
          <TrendingDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </Card>
      </div>
    </div>
  );
}
