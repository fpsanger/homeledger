import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";
import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";
import { generateOccurrence, isActiveInMonth } from "./RecurringTransaction";

type AnnualReportInput = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
  recurringRules?: RecurringTransactionRecord[];
  year: number;
  personId?: string;
};

export type MonthSummary = {
  month: number;
  income: number;
  expenses: number;
  balance: number;
  investments: number;
  investmentsByPerson: Record<string, number>;
  incomeByPerson: Record<string, number>;
  expensesByPerson: Record<string, number>;
};

export type AnnualReportResult = {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  totalInvestments: number;
};

export function buildAnnualReport(input: AnnualReportInput): AnnualReportResult {
  const { transactions, installments, recurringRules = [], year, personId } = input;

  const filteredTransactions = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getUTCFullYear() === year;
    })
    .filter((t) => (personId ? t.personId === personId : true));

  const filteredInstallments = installments.filter((i) => i.transactionYear === year);

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;

    const activeRecurring = recurringRules
      .filter((r) => isActiveInMonth(r, year, month) && (personId ? r.personId === personId : true))
      .map((r) => generateOccurrence(r, year, month));

    const allTransactions = [...filteredTransactions, ...activeRecurring];

    const income = allTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && t.type === "INCOME";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTxns = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getUTCMonth() + 1 === month && t.type === "EXPENSE";
    });
    const monthInstallments = filteredInstallments.filter((i) => i.transactionMonth === month);

    const expenseTransactions = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
    const expenseInstallments = monthInstallments.reduce((sum, i) => sum + i.amount, 0);
    const expenses = expenseTransactions + expenseInstallments;

    const expensesByPerson: Record<string, number> = {};
    for (const t of expenseTxns) {
      expensesByPerson[t.personId] = (expensesByPerson[t.personId] ?? 0) + t.amount;
    }
    for (const i of monthInstallments) {
      if (i.personId) {
        expensesByPerson[i.personId] = (expensesByPerson[i.personId] ?? 0) + i.amount;
      }
    }

    const investmentTxns = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getUTCMonth() + 1 === month && t.type === "INVESTMENT";
    });
    const investments = investmentTxns.reduce((sum, t) => sum + t.amount, 0);
    const investmentsByPerson: Record<string, number> = {};
    for (const t of investmentTxns) {
      investmentsByPerson[t.personId] = (investmentsByPerson[t.personId] ?? 0) + t.amount;
    }

    const incomeTxns = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getUTCMonth() + 1 === month && t.type === "INCOME";
    });
    const incomeByPerson: Record<string, number> = {};
    for (const t of incomeTxns) {
      incomeByPerson[t.personId] = (incomeByPerson[t.personId] ?? 0) + t.amount;
    }

    return {
      month,
      income,
      expenses,
      balance: income - expenses,
      investments,
      investmentsByPerson,
      incomeByPerson,
      expensesByPerson,
    };
  });

  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
  const totalInvestments = months.reduce((sum, m) => sum + m.investments, 0);

  return {
    year,
    months,
    totalIncome,
    totalExpenses,
    totalBalance: totalIncome - totalExpenses,
    totalInvestments,
  };
}
