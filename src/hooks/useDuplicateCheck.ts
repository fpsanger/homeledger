"use client";

import { useEffect, useState } from "react";
import { isDuplicateTransaction } from "../domain/services/isDuplicateTransaction";
import type { TransactionRecord } from "../domain/repositories/ITransactionRepository";

export function useDuplicateCheck(
  type: "EXPENSE" | "INCOME",
  amount: number | null,
  date: string | null,
  refreshKey = 0,
): boolean {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    fetch(`/api/monthly-view?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .catch(() => {});
  }, [refreshKey]);

  return isDuplicateTransaction(transactions, type, amount, date);
}
