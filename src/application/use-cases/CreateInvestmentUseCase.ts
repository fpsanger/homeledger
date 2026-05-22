import { createInvestment } from "../../domain/entities/Transaction";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateInvestmentCategory } from "../../domain/services/CategoryTree";

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  categoryId: string;
};

export async function createInvestmentUseCase(
  input: Input,
  repo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
): Promise<TransactionRecord> {
  const categories = await categoryRepo.findAll();
  validateInvestmentCategory(input.categoryId, categories);

  const investment = createInvestment(input);
  return repo.save(investment);
}
