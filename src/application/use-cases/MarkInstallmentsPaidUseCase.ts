import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

export async function markInstallmentsPaidUseCase(
  ids: string[],
  repo: ICreditCardPurchaseRepository,
): Promise<void> {
  if (ids.length === 0) return;
  await repo.markInstallmentsPaid(ids);
}
