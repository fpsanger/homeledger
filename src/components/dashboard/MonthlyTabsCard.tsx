"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";

type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
};

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
};

type Person = { id: string; name: string };

type Props = {
  year: number;
  month: number;
  people: Person[];
  transactions: Transaction[];
  installments: Installment[];
};

export function MonthlyTabsCard({
  year,
  month,
  people,
  transactions,
  installments,
}: Props) {
  const [tab, setTab] = useState<"transactions" | "installments">("transactions");

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Visão Mensal</CardTitle>
          <MonthNav year={year} month={month} />
        </div>
        <div className="flex gap-1.5 mt-4">
          <button
            type="button"
            onClick={() => setTab("transactions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              tab === "transactions"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Transações
            {transactions.length > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                  tab === "transactions"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {transactions.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("installments")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              tab === "installments"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Parcelas
            {installments.length > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                  tab === "installments"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {installments.length}
              </span>
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {tab === "transactions" ? (
          <TransactionTable transactions={transactions} people={people} />
        ) : (
          <InstallmentTable installments={installments} />
        )}
      </CardContent>
    </Card>
  );
}
