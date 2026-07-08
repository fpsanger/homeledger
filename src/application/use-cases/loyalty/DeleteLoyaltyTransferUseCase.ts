import type { ILoyaltyTransferRepository } from "../../../domain/repositories/ILoyaltyTransferRepository";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import { NotFoundError } from "../../../domain/errors";

export async function deleteLoyaltyTransferUseCase(
  id: string,
  transferRepo: ILoyaltyTransferRepository,
  transactionRepo: ILoyaltyTransactionRepository,
): Promise<void> {
  const existing = await transferRepo.findById(id);
  if (!existing) throw new NotFoundError(`LoyaltyTransfer ${id} not found`);

  const linkedTransactions = await transactionRepo.findByTransferId(id);
  for (const tx of linkedTransactions) {
    await transactionRepo.delete(tx.id);
  }

  await transferRepo.delete(id);
}
