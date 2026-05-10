import type { ITransactionRepository, TransactionRecord, IncomeSource } from "../../domain/repositories/ITransactionRepository";

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
): Promise<TransactionRecord> {
  if (!input.personId) throw new Error("Person is required");
  if (input.amount <= 0) throw new Error("Amount must be positive");
  if (!input.date) throw new Error("Date is required");
  if (!(VALID_SOURCES as string[]).includes(input.source)) {
    throw new Error("Invalid income source");
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
