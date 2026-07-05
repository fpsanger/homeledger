import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";

export function findDuplicateRecurringTransaction(
  existing: RecurringTransactionRecord[],
  type: "INCOME" | "EXPENSE",
  amount: number | null,
): RecurringTransactionRecord | null {
  if (amount === null) return null;

  return existing.find((r) => r.type === type && r.amount === amount) ?? null;
}
