import { createExpense } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateExpenseCategory } from "../../domain/services/CategoryTree";
import { isDuplicateTransaction } from "../../domain/services/isDuplicateTransaction";

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: Exclude<TransactionRecord["paymentMethod"], null>;
  categoryId: string | null;
};

export async function createExpenseUseCase(
  input: Input,
  repo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
): Promise<{ record: TransactionRecord; isDuplicate: boolean }> {
  const expense = createExpense(input);

  const year = input.date.getUTCFullYear();
  const month = input.date.getUTCMonth() + 1;
  const existing = await repo.findByPersonAndMonth(input.personId, year, month);
  const dateStr = input.date.toISOString().slice(0, 10);
  const isDuplicate = isDuplicateTransaction(existing, "EXPENSE", input.amount, dateStr);

  if (expense.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateExpenseCategory(expense.categoryId, categories);
  }

  const record = await repo.save(expense);
  return { record, isDuplicate };
}
