import type { LoyaltyTransactionRecord } from "../entities/LoyaltyTransaction";

export type { LoyaltyTransactionRecord };

export interface ILoyaltyTransactionRepository {
  save(tx: LoyaltyTransactionRecord): Promise<LoyaltyTransactionRecord>;
  findById(id: string): Promise<LoyaltyTransactionRecord | null>;
  findByProgramId(programId: string): Promise<LoyaltyTransactionRecord[]>;
  findByProgramIdAndPersonId(programId: string, personId: string): Promise<LoyaltyTransactionRecord[]>;
  findByTransferId(transferId: string): Promise<LoyaltyTransactionRecord[]>;
  delete(id: string): Promise<void>;
}
