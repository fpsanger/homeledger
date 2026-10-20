import { NotFoundError } from "../../domain/errors";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";
import {
  updateRecurringTransaction,
  type YearMonth,
} from "../../domain/services/RecurringTransaction";

type UpdateableFields = Partial<
  Pick<
    RecurringTransactionRecord,
    "amount" | "description" | "categoryId" | "paymentMethod" | "frequency"
  >
>;

type Input = {
  id: string;
  newId: string;
  updates: UpdateableFields;
  effectiveFrom: YearMonth;
};

/** Applies `updates` to a recurring transaction from `effectiveFrom` onward. */
export async function updateRecurringTransactionUseCase(
  input: Input,
  repo: IRecurringTransactionRepository,
): Promise<RecurringTransactionRecord> {
  const { id, newId, updates, effectiveFrom } = input;

  const rule = await repo.findById(id);
  if (!rule) throw new NotFoundError("Recurring transaction not found");

  const result = updateRecurringTransaction(rule, updates, newId, effectiveFrom);

  if (result.kind === "in-place") {
    return repo.update(result.rule.id, updates);
  }

  return repo.saveSplit({ id: result.closed.id, endDate: result.closed.endDate }, result.next);
}
