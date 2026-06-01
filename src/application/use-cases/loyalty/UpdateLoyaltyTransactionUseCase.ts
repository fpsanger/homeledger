import type { ILoyaltyTransactionRepository, LoyaltyTransactionRecord } from "../../../domain/repositories/ILoyaltyTransactionRepository";
import type { LoyaltyTransactionType } from "../../../domain/entities/LoyaltyTransaction";
import { NotFoundError } from "../../../domain/errors";

const TRANSFER_TYPES: LoyaltyTransactionType[] = ["TRANSFER_OUT", "TRANSFER_IN"];

type Input = {
  id: string;
  points?: number;
  date?: Date;
  description?: string | null;
  expiresAt?: Date | null;
  costBrl?: number | null;
  valueBrl?: number | null;
};

export async function updateLoyaltyTransactionUseCase(
  input: Input,
  repo: ILoyaltyTransactionRepository,
): Promise<LoyaltyTransactionRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new NotFoundError(`LoyaltyTransaction ${input.id} not found`);

  if (TRANSFER_TYPES.includes(existing.type)) {
    throw new Error("Transfer transactions cannot be updated directly. Delete and recreate the transfer.");
  }

  const updated: LoyaltyTransactionRecord = {
    ...existing,
    points: input.points ?? existing.points,
    date: input.date ?? existing.date,
    description: input.description !== undefined ? input.description : existing.description,
    expiresAt: input.expiresAt !== undefined ? input.expiresAt : existing.expiresAt,
    costBrl: input.costBrl !== undefined ? input.costBrl : existing.costBrl,
    valueBrl: input.valueBrl !== undefined ? input.valueBrl : existing.valueBrl,
    updatedAt: new Date(),
  };

  return repo.save(updated);
}
