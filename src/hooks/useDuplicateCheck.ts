"use client";

import { useEffect, useState } from "react";
import { isDuplicateTransaction } from "../domain/services/isDuplicateTransaction";
import type { TransactionRecord } from "../domain/repositories/ITransactionRepository";

export function useDuplicateCheck(
  type: "EXPENSE" | "INCOME" | "INVESTMENT",
  amount: number | null,
  date: string | null,
  refreshKey = 0,
): boolean {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;

    fetch(`/api/monthly-view?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .catch(() => {});
  }, [date, refreshKey]);

  return isDuplicateTransaction(transactions, type, amount, date);
}
