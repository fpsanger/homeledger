import type { TransactionRecord } from "../repositories/ITransactionRepository";

const DUPLICATE_WINDOW_DAYS = 30;

function withinDays(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  const diff = Math.abs(aDate.getTime() - b.getTime());
  return diff <= DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function findDuplicateTransaction(
  existing: TransactionRecord[],
  type: "EXPENSE" | "INCOME" | "INVESTMENT",
  amount: number | null,
  date: string | null,
): TransactionRecord | null {
  if (amount === null || date === null) return null;

  const matches = existing.filter(
    (t) => t.type === type && t.amount === amount && withinDays(t.date, date),
  );
  if (matches.length === 0) return null;

  const targetMs = new Date(date).getTime();
  return matches.reduce((closest, t) => {
    const dA = Math.abs(new Date(t.date).getTime() - targetMs);
    const dB = Math.abs(new Date(closest.date).getTime() - targetMs);
    return dA < dB ? t : closest;
  });
}
