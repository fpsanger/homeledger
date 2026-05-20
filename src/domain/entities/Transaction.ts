import type { IncomeSource, TransactionRecord } from "../repositories/ITransactionRepository";

type CreateExpenseInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: Exclude<TransactionRecord["paymentMethod"], null>;
  categoryId: string | null;
};

type CreateIncomeInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  source: IncomeSource;
  categoryId: string | null;
};

export function createExpense(input: CreateExpenseInput): TransactionRecord {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (!input.date) {
    throw new Error("Date is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return {
    id: input.id,
    personId: input.personId,
    type: "EXPENSE",
    amount: input.amount,
    date: input.date,
    description: input.description,
    paymentMethod: input.paymentMethod,
    source: null,
    categoryId: input.categoryId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createIncome(input: CreateIncomeInput): TransactionRecord {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (!input.date) {
    throw new Error("Date is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (!input.source) {
    throw new Error("Source is required");
  }

  return {
    id: input.id,
    personId: input.personId,
    type: "INCOME",
    amount: input.amount,
    date: input.date,
    description: input.description,
    paymentMethod: null,
    source: input.source,
    categoryId: input.categoryId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
