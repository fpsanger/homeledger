import { createExpense } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateExpenseCategory } from "../../domain/services/CategoryTree";

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
  categoryRepo: ICategoryRepository,
): Promise<TransactionRecord> {
  const expense = createExpense(input);

  if (expense.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateExpenseCategory(expense.categoryId, categories);
  }

  return repo.save(expense);
}
