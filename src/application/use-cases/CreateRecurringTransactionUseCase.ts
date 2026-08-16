import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";
import { findDuplicateRecurringTransaction } from "../../domain/services/isDuplicateRecurringTransaction";
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
): Promise<{ record: RecurringTransactionRecord; isDuplicate: boolean }> {
  const rule = createRecurringTransaction(input);

  const year = input.startDate.getUTCFullYear();
  const month = input.startDate.getUTCMonth() + 1;
  const existing = await repo.findAllActiveByMonth(year, month);
  const isDuplicate =
    findDuplicateRecurringTransaction(existing, input.type, input.amount) !== null;

  const record = await repo.save(rule);
  return { record, isDuplicate };
}
