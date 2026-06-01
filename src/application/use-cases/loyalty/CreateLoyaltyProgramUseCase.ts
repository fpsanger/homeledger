import { createLoyaltyProgram } from "../../../domain/entities/LoyaltyProgram";
import type { ILoyaltyProgramRepository, LoyaltyProgramRecord } from "../../../domain/repositories/ILoyaltyProgramRepository";
import type { LoyaltyProgramType } from "../../../domain/entities/LoyaltyProgram";

type Input = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  color: string;
};

export async function createLoyaltyProgramUseCase(
  input: Input,
  repo: ILoyaltyProgramRepository,
): Promise<LoyaltyProgramRecord> {
  const program = createLoyaltyProgram(input);
  return repo.save(program);
}
