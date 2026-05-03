import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function cancelInstallmentPurchaseUseCase(
  purchaseId: string,
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  await repo.cancelPurchase(purchaseId);
}
