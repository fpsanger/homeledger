import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

export async function listCreditCardsUseCase(
  repo: ICreditCardRepository,
): Promise<CreditCardRecord[]> {
  return repo.findAll();
}
