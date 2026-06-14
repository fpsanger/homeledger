import type { TransactionRecord } from "../repositories/ITransactionRepository";

const DUPLICATE_WINDOW_DAYS = 30;

function withinDays(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  const diff = Math.abs(aDate.getTime() - b.getTime());
  return diff <= DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function isDuplicateTransaction(
  existing: TransactionRecord[],
  type: "EXPENSE" | "INCOME" | "INVESTMENT",
  amount: number | null,
  date: string | null,
): boolean {
  if (amount === null || date === null) return false;

  return existing.some((t) => t.type === type && t.amount === amount && withinDays(t.date, date));
}
