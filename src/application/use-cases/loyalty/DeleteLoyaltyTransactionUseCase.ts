import type { LoyaltyTransactionType } from "../../../domain/entities/LoyaltyTransaction";
import { NotFoundError } from "../../../domain/errors";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";

const TRANSFER_TYPES: LoyaltyTransactionType[] = ["TRANSFER_OUT", "TRANSFER_IN"];

export async function deleteLoyaltyTransactionUseCase(
  id: string,
  repo: ILoyaltyTransactionRepository,
): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError(`LoyaltyTransaction ${id} not found`);

  if (TRANSFER_TYPES.includes(existing.type)) {
    throw new Error(
      "Transfer transactions cannot be deleted directly. Delete the transfer instead.",
    );
  }

  await repo.delete(id);
}
