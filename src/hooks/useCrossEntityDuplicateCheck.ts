"use client";

import { useEffect, useState } from "react";
import { isCrossEntityDuplicate } from "../domain/services/isCrossEntityDuplicate";
import type { CreditCardPurchaseRecord } from "../domain/repositories/ICreditCardPurchaseRepository";

export function useCrossEntityDuplicateCheck(
  amount: number | null,
  date: string | null,
  paymentMethod: string | null,
  refreshKey = 0,
): boolean {
  const [purchases, setPurchases] = useState<CreditCardPurchaseRecord[]>([]);

  useEffect(() => {
    if (paymentMethod !== "CREDIT_CARD") {
      setPurchases([]);
      return;
    }

    const d = date ? new Date(date) : new Date();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;

    fetch(`/api/credit-card-purchases?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setPurchases(data.purchases ?? []))
      .catch(() => {});
  }, [date, paymentMethod, refreshKey]);

  return isCrossEntityDuplicate(purchases, amount, date);
}
