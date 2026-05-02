import type { TransactionRecord } from "../repositories/ITransactionRepository";

type CreateExpenseInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: TransactionRecord["paymentMethod"];
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
    categoryId: input.categoryId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
