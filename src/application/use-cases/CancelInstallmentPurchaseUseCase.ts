import { cancelInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function cancelInstallmentPurchaseUseCase(
  purchaseId: string,
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  const installments = await repo.findByPurchaseId(purchaseId);
  const canceled = cancelInstallmentPurchase(installments);
  await repo.updateInstallments(canceled);
}
