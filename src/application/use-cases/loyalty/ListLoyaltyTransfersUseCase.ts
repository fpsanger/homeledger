import type {
  ILoyaltyTransferRepository,
  LoyaltyTransferRecord,
} from "../../../domain/repositories/ILoyaltyTransferRepository";

export async function listLoyaltyTransfersUseCase(
  transferRepo: ILoyaltyTransferRepository,
): Promise<LoyaltyTransferRecord[]> {
  return transferRepo.findAll();
}
