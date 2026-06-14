import type { CreditCardPurchaseRecord } from "../repositories/ICreditCardPurchaseRepository";

const DUPLICATE_WINDOW_DAYS = 30;

function withinDays(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  const diff = Math.abs(aDate.getTime() - b.getTime());
  return diff <= DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function findDuplicateCreditCardPurchase(
  existing: CreditCardPurchaseRecord[],
  amount: number | null,
  date: string | null,
  creditCardId: string | null,
): CreditCardPurchaseRecord | null {
  if (amount === null || date === null || creditCardId === null) return null;

  const matches = existing.filter(
    (p) => p.totalAmount === amount && p.creditCardId === creditCardId && withinDays(p.purchaseDate, date),
  );
  if (matches.length === 0) return null;

  const targetMs = new Date(date).getTime();
  return matches.reduce((closest, p) => {
    const dA = Math.abs(new Date(p.purchaseDate).getTime() - targetMs);
    const dB = Math.abs(new Date(closest.purchaseDate).getTime() - targetMs);
    return dA < dB ? p : closest;
  });
}
