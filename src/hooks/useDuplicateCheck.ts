"use client";

import { useEffect, useState } from "react";
import { findDuplicateTransaction } from "../domain/services/isDuplicateTransaction";
import type { TransactionRecord } from "../domain/repositories/ITransactionRepository";

export function useDuplicateCheck(
  type: "EXPENSE" | "INCOME" | "INVESTMENT",
  amount: number | null,
  date: string | null,
  refreshKey = 0,
): TransactionRecord | null {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    const months = [-1, 0, 1].map((offset) => {
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
      return { year: m.getUTCFullYear(), month: m.getUTCMonth() + 1 };
    });

    Promise.all(
      months.map(({ year, month }) =>
        fetch(`/api/monthly-view?year=${year}&month=${month}`)
          .then((res) => res.json())
          .then((data) => data.transactions ?? [])
          .catch(() => []),
      ),
    ).then((results) => setTransactions(results.flat()));
  }, [date, refreshKey]);

  return findDuplicateTransaction(transactions, type, amount, date);
}
