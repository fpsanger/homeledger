import { createExpense } from "../../domain/entities/Transaction";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: TransactionRecord["paymentMethod"];
  categoryId: string | null;
};

export async function createExpenseUseCase(
  input: Input,
  repo: ITransactionRepository,
): Promise<TransactionRecord> {
  const expense = createExpense(input);
  return repo.save(expense);
}
