import type { CreditCardPurchaseRecord } from "../repositories/ICreditCardPurchaseRepository";

const DUPLICATE_WINDOW_DAYS = 30;

function withinDays(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  const diff = Math.abs(aDate.getTime() - b.getTime());
  return diff <= DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function isDuplicateCreditCardPurchase(
  existing: CreditCardPurchaseRecord[],
  amount: number | null,
  date: string | null,
  creditCardId: string | null,
): boolean {
  if (amount === null || date === null || creditCardId === null) return false;

  return existing.some(
    (p) =>
      p.totalAmount === amount && p.creditCardId === creditCardId && withinDays(p.purchaseDate, date),
  );
}
