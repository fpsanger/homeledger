import type { ILoyaltyProgramRepository, LoyaltyProgramRecord } from "../../../domain/repositories/ILoyaltyProgramRepository";

export async function listLoyaltyProgramsUseCase(
  repo: ILoyaltyProgramRepository,
): Promise<LoyaltyProgramRecord[]> {
  return repo.findAll();
}
