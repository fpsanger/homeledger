"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
};

type Person = { id: string; name: string };

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  DEBIT_CARD: "Debit Card",
  CREDIT_CARD: "Credit Card",
  PIX: "PIX",
  BANK_TRANSFER: "Bank Transfer",
  BOLETO: "Boleto",
};

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransactionTable({
  transactions,
  people,
}: {
  transactions: Transaction[];
  people: Person[];
}) {
  const router = useRouter();
  const byId = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      return;
    }
    router.refresh();
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions this month.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Person</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(t.date).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>{byId[t.personId] ?? t.personId}</TableCell>
              <TableCell>{t.description || "—"}</TableCell>
              <TableCell>
                <span
                  className={
                    t.type === "INCOME"
                      ? "text-green-600 font-medium text-sm"
                      : "text-red-600 font-medium text-sm"
                  }
                >
                  {t.type === "INCOME" ? "Income" : "Expense"}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod}
              </TableCell>
              <TableCell className="text-right font-medium">{fmt(t.amount)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === t.id}
                  onClick={() => handleDelete(t.id)}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === t.id ? "…" : "Delete"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-6 text-sm justify-end">
        <span className="text-green-600">Income: {fmt(totalIncome)}</span>
        <span className="text-red-600">Expenses: {fmt(totalExpenses)}</span>
        <span className={balance >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
          Balance: {fmt(balance)}
        </span>
      </div>
    </div>
  );
}
