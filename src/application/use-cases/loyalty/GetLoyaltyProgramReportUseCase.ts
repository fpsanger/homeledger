import { NotFoundError } from "../../../domain/errors";
import type { ILoyaltyProgramRepository } from "../../../domain/repositories/ILoyaltyProgramRepository";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import type { ILoyaltyTransferRepository } from "../../../domain/repositories/ILoyaltyTransferRepository";
import type { EnrichedTransaction, LoyaltyFifoResult } from "../../../domain/services/LoyaltyFifo";
import { computeLoyaltyFifo } from "../../../domain/services/LoyaltyFifo";

export async function getLoyaltyProgramReportUseCase(
  programId: string,
  programRepo: ILoyaltyProgramRepository,
  transactionRepo: ILoyaltyTransactionRepository,
  transferRepo: ILoyaltyTransferRepository,
  personId?: string,
): Promise<LoyaltyFifoResult> {
  const program = await programRepo.findById(programId);
  if (!program) throw new NotFoundError(`LoyaltyProgram ${programId} not found`);

  const transactions = personId
    ? await transactionRepo.findByProgramIdAndPersonId(programId, personId)
    : await transactionRepo.findByProgramId(programId);

  const result = computeLoyaltyFifo(transactions);
  return { ...result, transactions: await attachTransfers(result.transactions, transferRepo) };
}

async function attachTransfers(
  transactions: EnrichedTransaction[],
  transferRepo: ILoyaltyTransferRepository,
): Promise<EnrichedTransaction[]> {
  if (!transactions.some((tx) => tx.transferId)) return transactions;

  const transfers = new Map((await transferRepo.findAll()).map((t) => [t.id, t]));
  return transactions.map((tx) => {
    const transfer = tx.transferId ? transfers.get(tx.transferId) : undefined;
    return transfer
      ? {
          ...tx,
          transfer: { pointsSent: transfer.pointsSent, pointsReceived: transfer.pointsReceived },
        }
      : tx;
  });
}
