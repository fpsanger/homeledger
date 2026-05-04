import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";
import { createRecurringTransaction } from "../../domain/services/RecurringTransaction";

type Input = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: RecurringTransactionRecord["paymentMethod"];
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
};

export async function createRecurringTransactionUseCase(
  input: Input,
  repo: IRecurringTransactionRepository,
): Promise<RecurringTransactionRecord> {
  const rule = createRecurringTransaction(input);
  return repo.save(rule);
}
