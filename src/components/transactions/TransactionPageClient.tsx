"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { UnifiedTransactionForm } from "./UnifiedTransactionForm";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string; parentId: string | null };
type CreditCard = { id: string; name: string };

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

type Props = {
  year: number;
  month: number;
  people: Person[];
  currentPersonId: string;
  isGlobalLocked?: boolean;
  categories: Category[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
};

export function TransactionPageClient({
  year,
  month,
  people,
  currentPersonId,
  isGlobalLocked = false,
  categories,
  creditCards,
  transactions,
  installments,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"transactions" | "installments">("transactions");

  const leafCategories = categories.filter(
    (c) => !categories.some((other) => other.parentId === c.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <MonthNav year={year} month={month} people={people} currentPersonId={currentPersonId} basePath="/transactions" isGlobalLocked={isGlobalLocked} />
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Adicionar Transação
        </Button>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Adicionar Transação">
        <UnifiedTransactionForm
          people={people}
          categories={leafCategories}
          creditCards={creditCards}
          onSuccess={() => setDialogOpen(false)}
        />
      </Dialog>

      <div className="flex gap-1.5">
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
            <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
              tab === "transactions"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
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
            <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
              tab === "installments"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {installments.length}
            </span>
          )}
        </button>
      </div>

      <div>
        {tab === "transactions" ? (
          <TransactionTable
            transactions={transactions}
            installmentExpenses={installments.filter((i) => !i.isCanceled).reduce((s, i) => s + i.amount, 0)}
            people={people}
            categories={categories}
          />
        ) : (
          <InstallmentTable installments={installments} people={people} creditCards={creditCards} />
        )}
      </div>
    </div>
  );
}
