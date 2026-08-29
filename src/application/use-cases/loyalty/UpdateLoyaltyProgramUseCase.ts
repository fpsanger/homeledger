import type { LoyaltyProgramType } from "../../../domain/entities/LoyaltyProgram";
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
};

export async function updateLoyaltyProgramUseCase(
  input: Input,
  repo: ILoyaltyProgramRepository,
): Promise<LoyaltyProgramRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new NotFoundError(`LoyaltyProgram ${input.id} not found`);

  const name = input.name?.trim() ?? existing.name;
  if (!name) throw new Error("Name is required");

  const updated: LoyaltyProgramRecord = {
    ...existing,
    name,
    type: input.type ?? existing.type,
    color: input.color ?? existing.color,
    updatedAt: new Date(),
  };

  return repo.save(updated);
}
