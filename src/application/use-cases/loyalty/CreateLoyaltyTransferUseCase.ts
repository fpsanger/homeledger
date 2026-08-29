import { createLoyaltyTransaction } from "../../../domain/entities/LoyaltyTransaction";
import { createLoyaltyTransfer } from "../../../domain/entities/LoyaltyTransfer";
import type { ILoyaltyTransactionRepository } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import type {
  ILoyaltyTransferRepository,
  LoyaltyTransferRecord,
} from "../../../domain/repositories/ILoyaltyTransferRepository";
import { computeLoyaltyFifo } from "../../../domain/services/LoyaltyFifo";

type Input = {
  transferId: string;
  outTxId: string;
  inTxId: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  costBrl: number | null;
  transferDate: Date;
  personId: string | null;
  description: string | null;
};

export async function createLoyaltyTransferUseCase(
  input: Input,
  transferRepo: ILoyaltyTransferRepository,
  transactionRepo: ILoyaltyTransactionRepository,
): Promise<LoyaltyTransferRecord> {
  const transfer = createLoyaltyTransfer({
    id: input.transferId,
    fromProgramId: input.fromProgramId,
    toProgramId: input.toProgramId,
    pointsSent: input.pointsSent,
    pointsReceived: input.pointsReceived,
    costBrl: input.costBrl,
    transferDate: input.transferDate,
    personId: input.personId,
    description: input.description,
  });

  const savedTransfer = await transferRepo.save(transfer);

  const outTx = createLoyaltyTransaction({
    id: input.outTxId,
    programId: input.fromProgramId,
    personId: input.personId,
    transferId: savedTransfer.id,
    type: "TRANSFER_OUT",
    points: input.pointsSent,
    date: input.transferDate,
    description: input.description,
  });

  await transactionRepo.save(outTx);

  // Compute the FIFO cost of the sent points so the destination program
  // inherits the correct cost basis (enables accurate cost-per-1000 after bonus transfers).
  const fromTransactions = await transactionRepo.findByProgramId(input.fromProgramId);
  const { transactions: enriched } = computeLoyaltyFifo(fromTransactions);
  const outTxEnriched = enriched.find((t) => t.id === outTx.id);
  const inheritedCostBrl = outTxEnriched?.fifoData?.costBrl ?? null;

  const inTx = createLoyaltyTransaction({
    id: input.inTxId,
    programId: input.toProgramId,
    personId: input.personId,
    transferId: savedTransfer.id,
    type: "TRANSFER_IN",
    points: input.pointsReceived,
    costBrl: inheritedCostBrl,
    date: input.transferDate,
    description: input.description,
  });

  await transactionRepo.save(inTx);

  return savedTransfer;
}
