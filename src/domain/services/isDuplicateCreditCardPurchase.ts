import type { CreditCardPurchaseRecord } from "../repositories/ICreditCardPurchaseRepository";

function sameDay(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  return (
    aDate.getUTCFullYear() === b.getUTCFullYear() &&
    aDate.getUTCMonth() === b.getUTCMonth() &&
    aDate.getUTCDate() === b.getUTCDate()
  );
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
      p.totalAmount === amount &&
      p.creditCardId === creditCardId &&
      sameDay(p.purchaseDate, date),
  );
}
