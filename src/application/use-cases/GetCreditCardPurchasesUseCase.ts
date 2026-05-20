import type {
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
} from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function getCreditCardPurchasesUseCase(
  personId: string | undefined,
  repo: ICreditCardPurchaseRepository,
): Promise<CreditCardPurchaseWithInstallments[]> {
  return repo.findAllPurchasesWithInstallments(personId);
}
