import type { TransactionRecord } from "../repositories/ITransactionRepository";
import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";

type MonthlyViewInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  year: number;
  month: number;
  personId?: string;
};

type MonthlyViewResult = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
};

export function buildMonthlyView(input: MonthlyViewInput): MonthlyViewResult {
  const { transactions, installments, year, month, personId } = input;

  const matchesMonth = (date: Date) => {
    const d = new Date(date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  };

  const filteredTransactions = transactions
    .filter((t) => matchesMonth(t.date))
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments
    .filter((i) => i.dueYear === year && i.dueMonth === month);

  return {
    transactions: filteredTransactions,
    installments: filteredInstallments,
  };
}
