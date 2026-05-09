import { NotFoundError } from "../../domain/errors";
import type { IRecurringTransactionRepository } from "../../domain/repositories/IRecurringTransactionRepository";
import { cancelRecurringTransaction } from "../../domain/services/RecurringTransaction";

export async function cancelRecurringTransactionUseCase(
  id: string,
  today: Date,
  repo: IRecurringTransactionRepository,
): Promise<void> {
  const rule = await repo.findById(id);
  if (!rule) throw new NotFoundError("Recurring transaction not found");

  const canceled = cancelRecurringTransaction(rule, today);
  await repo.update(id, { endDate: canceled.endDate });
}
