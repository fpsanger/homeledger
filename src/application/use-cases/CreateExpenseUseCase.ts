import { createExpense } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateExpenseCategory } from "../../domain/services/CategoryTree";
import { findDuplicateTransaction } from "../../domain/services/isDuplicateTransaction";

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

  const baseYear = input.date.getUTCFullYear();
  const baseMonth = input.date.getUTCMonth() + 1;
  const dateStr = input.date.toISOString().slice(0, 10);

  const adjacentMonths = [-1, 0, 1].map((offset) => {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const existingArrays = await Promise.all(
    adjacentMonths.map(({ year, month }) =>
      repo.findByPersonAndMonth(input.personId, year, month),
    ),
  );
  const existing = existingArrays.flat();
  const isDuplicate = findDuplicateTransaction(existing, "EXPENSE", input.amount, dateStr) !== null;

  if (expense.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateExpenseCategory(expense.categoryId, categories);
  }

  const record = await repo.save(expense);
  return { record, isDuplicate };
}
