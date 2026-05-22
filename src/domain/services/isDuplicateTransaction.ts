import type { TransactionRecord } from "../repositories/ITransactionRepository";

function sameDay(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  return (
    aDate.getUTCFullYear() === b.getUTCFullYear() &&
    aDate.getUTCMonth() === b.getUTCMonth() &&
    aDate.getUTCDate() === b.getUTCDate()
  );
}

export function isDuplicateTransaction(
  existing: TransactionRecord[],
  type: "EXPENSE" | "INCOME" | "INVESTMENT",
  amount: number | null,
  date: string | null,
): boolean {
  if (amount === null || date === null) return false;

  return existing.some((t) => t.type === type && t.amount === amount && sameDay(t.date, date));
}
