import type { LoyaltyTransferRecord } from "../entities/LoyaltyTransfer";

export type { LoyaltyTransferRecord };

export interface ILoyaltyTransferRepository {
  save(transfer: LoyaltyTransferRecord): Promise<LoyaltyTransferRecord>;
  findById(id: string): Promise<LoyaltyTransferRecord | null>;
  delete(id: string): Promise<void>;
}
