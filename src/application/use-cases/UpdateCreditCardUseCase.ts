import {
  type ClosureType,
  type CreditCardRecord,
  createCreditCard,
} from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  closureNextMonth: boolean;
};

export async function updateCreditCardUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new Error("Credit card not found");
  const card = createCreditCard(input);
  return repo.update(card);
}
