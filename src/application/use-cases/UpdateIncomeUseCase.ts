import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
  IncomeSource,
} from "../../domain/repositories/ITransactionRepository";
import { validateIncomeCategory } from "../../domain/services/CategoryTree";

const VALID_SOURCES: IncomeSource[] = ["SALARY", "FREELANCE", "RENTAL", "INVESTMENT", "OTHER"];

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  source: IncomeSource;
  categoryId: string | null;
  description: string;
};

export async function updateIncomeUseCase(
  input: Input,
  repo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
): Promise<TransactionRecord> {
  if (!input.personId) throw new Error("Person is required");
  if (input.amount <= 0) throw new Error("Amount must be positive");
  if (!input.date) throw new Error("Date is required");
  if (!(VALID_SOURCES as string[]).includes(input.source)) {
    throw new Error("Invalid income source");
  }

  const existing = await repo.findById(input.id);
  if (!existing) throw new Error("Transaction not found");

  if (input.categoryId !== null) {
    const categories = await categoryRepo.findAll();
    validateIncomeCategory(input.categoryId, categories);
  }

  return repo.update(input.id, {
    personId: input.personId,
    amount: input.amount,
    date: input.date,
    source: input.source,
    categoryId: input.categoryId,
    description: input.description,
  });
}
