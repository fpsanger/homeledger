"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { maskCurrency } from "@/lib/maskCurrency";

type Transaction = { type: string; amount: number };
type Installment = { amount: number };

type Props = {
  transactions: Transaction[];
  installments?: Installment[];
};

export function MonthlySummaryCard({ transactions, installments = [] }: Props) {
  const { hidden } = usePrivacy();
  const formatAmount = (amount: number): string =>
    maskCurrency(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount),
      hidden,
    );
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            Saldo do Mês
          </p>
          <p
            className={`text-3xl font-semibold tracking-tight tabular-nums whitespace-nowrap ${
              isPositive ? "amount-positive" : "amount-negative"
            }`}
          >
            {formatAmount(balance)}
          </p>
        </div>
        <span
          className={`self-start sm:self-auto shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isPositive
              ? "border-income/20 amount-positive bg-income/8"
              : "border-expense/20 amount-negative bg-expense/8"
          }`}
        >
          {isPositive ? "Positivo" : "Negativo"}
        </span>
      </div>

      {/* Supporting stats */}
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="flex items-center justify-between gap-2 pr-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Receita
            </p>
            <p className="text-xl font-semibold tracking-tight tabular-nums mt-1 amount-positive">
              {formatAmount(income)}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        <div className="flex items-center justify-between gap-2 pl-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Despesas
            </p>
            <p className="text-xl font-semibold tracking-tight tabular-nums mt-1 amount-negative">
              {formatAmount(expenses)}
            </p>
          </div>
          <TrendingDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </div>
  );
}
