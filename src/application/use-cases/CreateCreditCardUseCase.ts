import {
  createCreditCard,
  type ClosureType,
  type CreditCardRecord,
} from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

export async function createCreditCardUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardRecord> {
  const card = createCreditCard({ id: crypto.randomUUID(), ...input });
  return repo.save(card);
}
