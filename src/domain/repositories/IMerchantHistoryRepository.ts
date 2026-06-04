export interface IMerchantHistoryRepository {
  findByMerchantKey(
    key: string,
  ): Promise<{ categoryId: string; usageCount: number } | null>;
  upsert(merchantKey: string, categoryId: string): Promise<void>;
}
