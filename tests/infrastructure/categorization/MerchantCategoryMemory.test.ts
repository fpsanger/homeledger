import type { CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";
import { MerchantCategoryMemory } from "../../../src/infrastructure/categorization/MerchantCategoryMemory";
import type {
  AvailableCategory,
  ICategorizer,
} from "../../../src/infrastructure/categorization/types";

const category = (id: string, name: string, parentId: string | null): CategoryRecord => ({
  id,
  name,
  parentId,
  level: parentId ? 1 : 0,
  householdId: "default",
  createdAt: new Date(),
});

const CATEGORIES = [
  category("food", "Alimentação", null),
  category("bakery", "Padaria", "food"),
  category("transport", "Transporte", null),
];

const repo = { findAll: jest.fn().mockResolvedValue(CATEGORIES) } as never;

describe("MerchantCategoryMemory", () => {
  it("offers only leaf categories, labelled with their full path", async () => {
    const seen: AvailableCategory[][] = [];
    const spy: ICategorizer = {
      categorize: async (_merchant, categories) => {
        seen.push(categories);
        return null;
      },
    };

    await new MerchantCategoryMemory(repo, [spy], jest.fn()).suggest("Padaria X");

    expect(seen[0]).toEqual([
      { categoryId: "bakery", label: "Alimentação/Padaria" },
      { categoryId: "transport", label: "Transporte" },
    ]);
  });

  it("returns the category the categorizers pick", async () => {
    const picker: ICategorizer = {
      categorize: async () => ({ categoryId: "bakery", confidence: 0.9, source: "history" }),
    };

    const result = await new MerchantCategoryMemory(repo, [picker], jest.fn()).suggest("Padaria X");

    expect(result).toBe("bakery");
  });

  it("returns null when no categorizer knows the merchant", async () => {
    const silent: ICategorizer = { categorize: async () => null };

    const result = await new MerchantCategoryMemory(repo, [silent], jest.fn()).suggest("Unknown");

    expect(result).toBeNull();
  });

  it("hands what the user chose to the remember function", async () => {
    const remember = jest.fn().mockResolvedValue(undefined);

    await new MerchantCategoryMemory(repo, [], remember).learn("Padaria X", "bakery");

    expect(remember).toHaveBeenCalledWith("Padaria X", "bakery");
  });
});
