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
  return {
    ...result,
    transactions: await attachTransfers(result.transactions, transferRepo, programRepo),
  };
}

async function attachTransfers(
  transactions: EnrichedTransaction[],
  transferRepo: ILoyaltyTransferRepository,
  programRepo: ILoyaltyProgramRepository,
): Promise<EnrichedTransaction[]> {
  if (!transactions.some((tx) => tx.transferId)) return transactions;

  const [allTransfers, allPrograms] = await Promise.all([
    transferRepo.findAll(),
    programRepo.findAll(),
  ]);
  const transfers = new Map(allTransfers.map((t) => [t.id, t]));
  const names = new Map(allPrograms.map((p) => [p.id, p.name]));
  const nameOf = (id: string) => names.get(id) ?? id;

  return transactions.map((tx) => {
    const transfer = tx.transferId ? transfers.get(tx.transferId) : undefined;
    if (!transfer) return tx;
    return {
      ...tx,
      transfer: {
        pointsSent: transfer.pointsSent,
        pointsReceived: transfer.pointsReceived,
        fromProgramName: nameOf(transfer.fromProgramId),
        toProgramName: nameOf(transfer.toProgramId),
      },
    };
  });
}
