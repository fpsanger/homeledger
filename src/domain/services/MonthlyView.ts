import { generateOccurrence, isActiveInMonth } from "./RecurringTransaction";
import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";
import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type MonthlyViewInput = {
  transactions: TransactionRecord[];
  /** Must already be scoped to personId by the caller — InstallmentRecord has no personId field */
  installments: InstallmentRecord[];
  recurringRules?: RecurringTransactionRecord[];
  year: number;
  month: number;
  personId?: string;
};

type MonthlyViewResult = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
};

export function buildMonthlyView(input: MonthlyViewInput): MonthlyViewResult {
  const { transactions, installments, recurringRules = [], year, month, personId } = input;

  const matchesMonth = (date: Date) => {
    const d = new Date(date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  };

  const filteredTransactions = transactions
    .filter((t) => matchesMonth(t.date))
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments.filter(
    (i) => i.dueYear === year && i.dueMonth === month && !i.isCanceled,
  );

  const activeRules = recurringRules.filter(
    (r) => isActiveInMonth(r, year, month) && (personId ? r.personId === personId : true),
  );

  const occurrences = activeRules.map((r) => generateOccurrence(r, year, month));

  return {
    transactions: [...filteredTransactions, ...occurrences],
    installments: filteredInstallments,
  };
}
