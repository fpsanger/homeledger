"use client";

import { useEffect, useState } from "react";
import type { CreditCardPurchaseRecord } from "../domain/repositories/ICreditCardPurchaseRepository";
import { findCrossEntityDuplicate } from "../domain/services/isCrossEntityDuplicate";

export function useCrossEntityDuplicateCheck(
  amount: number | null,
  date: string | null,
  paymentMethod: string | null,
  refreshKey = 0,
): CreditCardPurchaseRecord | null {
  const [purchases, setPurchases] = useState<CreditCardPurchaseRecord[]>([]);

  useEffect(() => {
    void refreshKey;
    if (paymentMethod !== "CREDIT_CARD") {
      setPurchases([]);
      return;
    }

    const d = date ? new Date(date) : new Date();
    const months = [-1, 0, 1].map((offset) => {
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
      return { year: m.getUTCFullYear(), month: m.getUTCMonth() + 1 };
    });

    Promise.all(
      months.map(({ year, month }) =>
        fetch(`/api/credit-card-purchases?year=${year}&month=${month}`)
          .then((res) => res.json())
          .then((data) => data.purchases ?? [])
          .catch(() => []),
      ),
    ).then((results) => setPurchases(results.flat()));
  }, [date, paymentMethod, refreshKey]);

  return findCrossEntityDuplicate(purchases, amount, date);
}
