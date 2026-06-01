import type { ILoyaltyProgramRepository } from "../../../domain/repositories/ILoyaltyProgramRepository";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import { NotFoundError } from "../../../domain/errors";

export async function deleteLoyaltyProgramUseCase(
  id: string,
  programRepo: ILoyaltyProgramRepository,
  transactionRepo: ILoyaltyTransactionRepository,
): Promise<void> {
  const existing = await programRepo.findById(id);
  if (!existing) throw new NotFoundError(`LoyaltyProgram ${id} not found`);

  const transactions = await transactionRepo.findByProgramId(id);
  if (transactions.length > 0) {
    throw new Error("Cannot delete program with existing transactions");
  }

  await programRepo.delete(id);
}
