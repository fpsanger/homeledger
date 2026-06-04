import { MerchantHistoryCategorizer } from "../../../src/infrastructure/categorization/MerchantHistoryCategorizer";
import type { IMerchantHistoryRepository } from "../../../src/domain/repositories/IMerchantHistoryRepository";

function makeRepo(
  record: { categoryId: string; usageCount: number } | null,
): IMerchantHistoryRepository {
  return {
    findByMerchantKey: jest.fn().mockResolvedValue(record),
    upsert: jest.fn().mockResolvedValue(undefined),
  };
}

describe("MerchantHistoryCategorizer", () => {
  it("returns history match when merchant key is known", async () => {
    const repo = makeRepo({ categoryId: "cat-food", usageCount: 3 });
    const categorizer = new MerchantHistoryCategorizer(repo);

    const result = await categorizer.categorize("PADARIA DO JOAO LTDA");

    expect(result.categoryId).toBe("cat-food");
    expect(result.source).toBe("history");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("returns null categoryId when merchant is unknown", async () => {
    const repo = makeRepo(null);
    const categorizer = new MerchantHistoryCategorizer(repo);

    const result = await categorizer.categorize("LOJA DESCONHECIDA XYZ");

    expect(result.categoryId).toBeNull();
    expect(result.source).toBe("history");
  });

  it("normalizes description before lookup", async () => {
    const repo = makeRepo({ categoryId: "cat-food", usageCount: 1 });
    const categorizer = new MerchantHistoryCategorizer(repo);

    await categorizer.categorize("  PADARIA DO JOÃO  ");

    expect(repo.findByMerchantKey).toHaveBeenCalledWith("padaria do joao");
  });

  it("is case-insensitive for lookup key", async () => {
    const repo = makeRepo({ categoryId: "cat-food", usageCount: 1 });
    const categorizer = new MerchantHistoryCategorizer(repo);

    await categorizer.categorize("PADARIA DO JOAO");

    expect(repo.findByMerchantKey).toHaveBeenCalledWith("padaria do joao");
  });
});
