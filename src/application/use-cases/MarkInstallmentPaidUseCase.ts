import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function markInstallmentPaidUseCase(
  installmentId: string,
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  await repo.markInstallmentPaid(installmentId);
}
