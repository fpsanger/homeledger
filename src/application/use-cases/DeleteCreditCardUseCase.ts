import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

export async function deleteCreditCardUseCase(
  id: string,
  repo: ICreditCardRepository,
): Promise<void> {
  const hasPurchases = await repo.hasPurchases(id);
  if (hasPurchases) throw new Error("Cannot delete a card with existing purchases");
  await repo.delete(id);
}
