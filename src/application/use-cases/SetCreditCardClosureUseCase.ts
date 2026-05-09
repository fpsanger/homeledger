import type { CreditCardClosureRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
};

export async function setCreditCardClosureUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<CreditCardClosureRecord> {
  const card = await repo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");
  if (card.closureType !== "VARIABLE")
    throw new Error("Closure dates can only be set for VARIABLE cards");
  if (input.closureDay < 1 || input.closureDay > 31)
    throw new Error("closureDay must be between 1 and 31");
  return repo.setClosure(input);
}
