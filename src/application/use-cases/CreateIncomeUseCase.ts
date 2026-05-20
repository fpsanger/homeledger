import { createIncome } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  IncomeSource,
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateIncomeCategory } from "../../domain/services/CategoryTree";

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
): Promise<TransactionRecord> {
  const income = createIncome(input);

  if (income.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateIncomeCategory(income.categoryId, categories);
  }

  return repo.save(income);
}
