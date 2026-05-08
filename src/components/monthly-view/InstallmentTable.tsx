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

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
};

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function InstallmentTable({ installments }: { installments: Installment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setError(null);
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      return;
    }
    router.refresh();
  }

  async function handleMarkPaid(id: string) {
    setError(null);
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}/paid`, { method: "PATCH" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to mark as paid.");
      return;
    }
    router.refresh();
  }

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = total - paid;

  if (installments.length === 0) {
    return <p className="text-sm text-muted-foreground">No installments this month.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Installment</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => (
            <TableRow key={inst.id}>
              <TableCell className="text-sm">#{inst.installmentNumber}</TableCell>
              <TableCell className="text-right font-medium">{fmt(inst.amount)}</TableCell>
              <TableCell>
                <span
                  className={
                    inst.isPaid
                      ? "text-green-600 text-sm font-medium"
                      : "text-muted-foreground text-sm"
                  }
                >
                  {inst.isPaid ? "Paid" : "Unpaid"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  {!inst.isPaid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loadingId === inst.id}
                      onClick={() => handleMarkPaid(inst.id)}
                      className="text-green-600 hover:text-green-600"
                    >
                      {loadingId === inst.id ? "…" : "Mark Paid"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingId === inst.id}
                    onClick={() => handleDelete(inst.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    {loadingId === inst.id ? "…" : "Delete"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-6 text-sm justify-end">
        <span>Total: {fmt(total)}</span>
        <span className="text-green-600">Paid: {fmt(paid)}</span>
        <span className="text-red-600">Remaining: {fmt(remaining)}</span>
      </div>
    </div>
  );
}
