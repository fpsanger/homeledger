import type { CategorySuggestion } from "../../domain/entities/CategorySuggestion";
import type { IMerchantHistoryRepository } from "../../domain/repositories/IMerchantHistoryRepository";

function normalizeMerchantKey(description: string): string {
  return description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export class MerchantHistoryCategorizer {
  constructor(private readonly repo: IMerchantHistoryRepository) {}

  async categorize(description: string): Promise<CategorySuggestion> {
    const key = normalizeMerchantKey(description);
    const record = await this.repo.findByMerchantKey(key);

    if (record) {
      return { categoryId: record.categoryId, confidence: 0.9, source: "history" };
    }

    return { categoryId: null, confidence: 0, source: "history" };
  }
}
