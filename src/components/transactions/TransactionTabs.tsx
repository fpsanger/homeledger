"use client";

import { useState } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { IncomeForm } from "./IncomeForm";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string; parentId: string | null };

type Props = {
  people: Person[];
  categories: Category[];
};

export function TransactionTabs({ people, categories }: Props) {
  const [tab, setTab] = useState<"expense" | "income">("expense");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("expense")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "expense"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setTab("income")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "income"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Receita
        </button>
      </div>
      {tab === "expense" ? (
        <ExpenseForm people={people} categories={categories} />
      ) : (
        <IncomeForm people={people} categories={categories} />
      )}
    </div>
  );
}
