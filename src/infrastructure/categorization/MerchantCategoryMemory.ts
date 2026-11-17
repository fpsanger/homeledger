import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../domain/repositories/ICategoryRepository";
import type { IMerchantCategoryMemory } from "../../domain/repositories/IMerchantCategoryMemory";
import { isLeafCategory } from "../../domain/services/CategoryTree";
import { CategorizationPipeline } from "./CategorizationPipeline";
import type { AvailableCategory, ICategorizer } from "./types";

function pathOf(category: CategoryRecord, byId: Map<string, CategoryRecord>): string {
  const names: string[] = [];
  let current: CategoryRecord | undefined = category;
  while (current) {
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return names.join("/");
}

/**
 * Suggests categories for merchants from the rules and history the app already has, and records
 * the category the user picks. Only leaf categories are offered, as expenses require.
 */
export class MerchantCategoryMemory implements IMerchantCategoryMemory {
  private readonly pipeline: CategorizationPipeline;

  constructor(
    private readonly categories: ICategoryRepository,
    categorizers: ICategorizer[],
    private readonly remember: (merchant: string, categoryId: string) => Promise<void>,
  ) {
    this.pipeline = new CategorizationPipeline(categorizers);
  }

  async suggest(merchant: string): Promise<string | null> {
    const all = await this.categories.findAll();
    const byId = new Map(all.map((category) => [category.id, category]));
    const available: AvailableCategory[] = all
      .filter((category) => isLeafCategory(category.id, all))
      .map((category) => ({ categoryId: category.id, label: pathOf(category, byId) }));

    const suggestion = await this.pipeline.categorize(merchant, available);
    return suggestion.categoryId;
  }

  learn(merchant: string, categoryId: string): Promise<void> {
    return this.remember(merchant, categoryId);
  }
}
