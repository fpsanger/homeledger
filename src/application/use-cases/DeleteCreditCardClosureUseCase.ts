import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

type Input = {
  creditCardId: string;
  year: number;
  month: number;
};

export async function deleteCreditCardClosureUseCase(
  input: Input,
  repo: ICreditCardRepository,
): Promise<void> {
  const card = await repo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");
  if (card.closureType !== "VARIABLE")
    throw new Error("Closure dates can only be deleted for VARIABLE cards");
  const existing = await repo.findClosure(input.creditCardId, input.year, input.month);
  if (!existing) throw new Error("Closure not found for the given month");
  await repo.deleteClosure(input.creditCardId, input.year, input.month);
}
