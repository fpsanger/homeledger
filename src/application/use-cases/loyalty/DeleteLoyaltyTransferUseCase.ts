import type { ILoyaltyTransferRepository } from "../../../domain/repositories/ILoyaltyTransferRepository";
import { NotFoundError } from "../../../domain/errors";

export async function deleteLoyaltyTransferUseCase(
  id: string,
  repo: ILoyaltyTransferRepository,
): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError(`LoyaltyTransfer ${id} not found`);

  await repo.delete(id);
}
