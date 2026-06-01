import { computeLoyaltyFifo } from "../../../domain/services/LoyaltyFifo";
import type { LoyaltyFifoResult } from "../../../domain/services/LoyaltyFifo";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import { NotFoundError } from "../../../domain/errors";
import type { ILoyaltyProgramRepository } from "../../../domain/repositories/ILoyaltyProgramRepository";

export async function getLoyaltyProgramReportUseCase(
  programId: string,
  programRepo: ILoyaltyProgramRepository,
  transactionRepo: ILoyaltyTransactionRepository,
  personId?: string,
): Promise<LoyaltyFifoResult> {
  const program = await programRepo.findById(programId);
  if (!program) throw new NotFoundError(`LoyaltyProgram ${programId} not found`);

  const transactions = personId
    ? await transactionRepo.findByProgramIdAndPersonId(programId, personId)
    : await transactionRepo.findByProgramId(programId);

  return computeLoyaltyFifo(transactions);
}
