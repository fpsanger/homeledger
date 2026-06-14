"use client";

import { useEffect, useState } from "react";
import { isDuplicateCreditCardPurchase } from "../domain/services/isDuplicateCreditCardPurchase";
import type { CreditCardPurchaseRecord } from "../domain/repositories/ICreditCardPurchaseRepository";

export function useCreditCardDuplicateCheck(
  amount: number | null,
  date: string | null,
  creditCardId: string | null,
  refreshKey = 0,
): boolean {
  const [purchases, setPurchases] = useState<CreditCardPurchaseRecord[]>([]);

  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;

    fetch(`/api/credit-card-purchases?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setPurchases(data.purchases ?? []))
      .catch(() => {});
  }, [date, refreshKey]);

  return isDuplicateCreditCardPurchase(purchases, amount, date, creditCardId);
}
