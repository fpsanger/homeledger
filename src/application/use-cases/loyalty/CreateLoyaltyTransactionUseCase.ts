import type { LoyaltyTransactionType } from "../../../domain/entities/LoyaltyTransaction";
import { createLoyaltyTransaction } from "../../../domain/entities/LoyaltyTransaction";
import type {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionRecord,
} from "../../../domain/repositories/ILoyaltyTransactionRepository";

const TRANSFER_TYPES: LoyaltyTransactionType[] = ["TRANSFER_OUT", "TRANSFER_IN"];

type Input = {
  id: string;
  programId: string;
  personId: string | null;
  type: LoyaltyTransactionType;
  points: number;
  date: Date;
  description?: string | null;
  expiresAt?: Date | null;
  costBrl?: number | null;
  valueBrl?: number | null;
};

export async function createLoyaltyTransactionUseCase(
  input: Input,
  repo: ILoyaltyTransactionRepository,
): Promise<LoyaltyTransactionRecord> {
  if (TRANSFER_TYPES.includes(input.type)) {
    throw new Error(`Use CreateLoyaltyTransfer to create ${input.type} transactions`);
  }

  const tx = createLoyaltyTransaction({ ...input, transferId: null });
  return repo.save(tx);
}
