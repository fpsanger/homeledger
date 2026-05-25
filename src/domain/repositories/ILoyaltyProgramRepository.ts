import type { LoyaltyProgramRecord } from "../entities/LoyaltyProgram";

export type { LoyaltyProgramRecord };

export interface ILoyaltyProgramRepository {
  save(program: LoyaltyProgramRecord): Promise<LoyaltyProgramRecord>;
  findById(id: string): Promise<LoyaltyProgramRecord | null>;
  findAll(): Promise<LoyaltyProgramRecord[]>;
  delete(id: string): Promise<void>;
}
