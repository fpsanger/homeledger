import { createIncome } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  IncomeSource,
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateIncomeCategory } from "../../domain/services/CategoryTree";
import { findDuplicateTransaction } from "../../domain/services/isDuplicateTransaction";

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

  const baseYear = input.date.getUTCFullYear();
  const baseMonth = input.date.getUTCMonth() + 1;
  const dateStr = input.date.toISOString().slice(0, 10);

  const adjacentMonths = [-1, 0, 1].map((offset) => {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const existingArrays = await Promise.all(
    adjacentMonths.map(({ year, month }) => repo.findByPersonAndMonth(input.personId, year, month)),
  );
  const existing = existingArrays.flat();
  const isDuplicate = findDuplicateTransaction(existing, "INCOME", input.amount, dateStr) !== null;

  if (income.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateIncomeCategory(income.categoryId, categories);
  }

  const record = await repo.save(income);
  return { record, isDuplicate };
}
