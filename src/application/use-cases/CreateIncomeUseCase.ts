import { createIncome } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  IncomeSource,
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateIncomeCategory } from "../../domain/services/CategoryTree";
import { isDuplicateTransaction } from "../../domain/services/isDuplicateTransaction";

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  source: IncomeSource;
  categoryId: string | null;
};

export async function createIncomeUseCase(
  input: Input,
  repo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
): Promise<{ record: TransactionRecord; isDuplicate: boolean }> {
  const income = createIncome(input);

  const year = input.date.getUTCFullYear();
  const month = input.date.getUTCMonth() + 1;
  const existing = await repo.findByPersonAndMonth(input.personId, year, month);
  const dateStr = input.date.toISOString().slice(0, 10);
  const isDuplicate = isDuplicateTransaction(existing, "INCOME", input.amount, dateStr);

  if (income.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateIncomeCategory(income.categoryId, categories);
  }

  const record = await repo.save(income);
  return { record, isDuplicate };
}
