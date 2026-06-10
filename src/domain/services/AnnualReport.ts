import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type AnnualReportInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  year: number;
  personId?: string;
};

export type MonthSummary = {
  month: number;
  income: number;
  expenses: number;
  balance: number;
};

export type AnnualReportResult = {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
};

export function buildAnnualReport(input: AnnualReportInput): AnnualReportResult {
  const { transactions, installments, year, personId } = input;

  const filteredTransactions = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getUTCFullYear() === year;
    })
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments.filter((i) => i.transactionYear === year);

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;

    const income = filteredTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && t.type === "INCOME";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTransactions = filteredTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && t.type === "EXPENSE";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseInstallments = filteredInstallments
      .filter((i) => i.transactionMonth === month)
      .reduce((sum, i) => sum + i.amount, 0);

    const expenses = expenseTransactions + expenseInstallments;

    return { month, income, expenses, balance: income - expenses };
  });

  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);

  return {
    year,
    months,
    totalIncome,
    totalExpenses,
    totalBalance: totalIncome - totalExpenses,
  };
}
