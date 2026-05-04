import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";
import { updateRecurringTransaction } from "../../domain/services/RecurringTransaction";

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
  today: Date;
};

export async function updateRecurringTransactionUseCase(
  input: Input,
  repo: IRecurringTransactionRepository,
): Promise<RecurringTransactionRecord> {
  const { id, newId, updates, today } = input;

  const rule = await repo.findById(id);
  if (!rule) throw new Error("Recurring transaction not found");

  const [closedRule, newRule] = updateRecurringTransaction(rule, updates, newId, today);

  await repo.update(closedRule.id, { endDate: closedRule.endDate });
  return repo.save(newRule);
}
