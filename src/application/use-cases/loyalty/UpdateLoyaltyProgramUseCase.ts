import type { LoyaltyProgramType } from "../../../domain/entities/LoyaltyProgram";
import { validateLoyaltyProgramReference } from "../../../domain/entities/LoyaltyProgram";
import { NotFoundError } from "../../../domain/errors";
import type {
  ILoyaltyProgramRepository,
  LoyaltyProgramRecord,
} from "../../../domain/repositories/ILoyaltyProgramRepository";

type Input = {
  id: string;
  name?: string;
  type?: LoyaltyProgramType;
  color?: string;
  /** undefined keeps the stored value; null clears it. */
  referenceMinPer1kBrl?: number | null;
  referenceMaxPer1kBrl?: number | null;
};

export async function updateLoyaltyProgramUseCase(
  input: Input,
  repo: ILoyaltyProgramRepository,
): Promise<LoyaltyProgramRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new NotFoundError(`LoyaltyProgram ${input.id} not found`);

  const name = input.name?.trim() ?? existing.name;
  if (!name) throw new Error("Name is required");

  const reference = {
    referenceMinPer1kBrl:
      input.referenceMinPer1kBrl === undefined
        ? existing.referenceMinPer1kBrl
        : input.referenceMinPer1kBrl,
    referenceMaxPer1kBrl:
      input.referenceMaxPer1kBrl === undefined
        ? existing.referenceMaxPer1kBrl
        : input.referenceMaxPer1kBrl,
  };
  validateLoyaltyProgramReference(reference);

  const updated: LoyaltyProgramRecord = {
    ...existing,
    name,
    type: input.type ?? existing.type,
    color: input.color ?? existing.color,
    ...reference,
    updatedAt: new Date(),
  };

  return repo.save(updated);
}
