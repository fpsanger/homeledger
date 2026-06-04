import type { CategorySuggestion } from "../../domain/entities/CategorySuggestion";
import type { AvailableCategory } from "./MerchantRuleCategorizer";

interface IRuleCategorizer {
  categorize(
    description: string,
    categories: AvailableCategory[],
  ): CategorySuggestion;
}

interface IHistoryCategorizer {
  categorize(description: string): Promise<CategorySuggestion>;
}

interface IOllamaCategorizer {
  categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion>;
}

export class CategorizationPipeline {
  constructor(
    private readonly rule: IRuleCategorizer,
    private readonly history: IHistoryCategorizer,
    private readonly ollama: IOllamaCategorizer,
  ) {}

  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion> {
    const ruleResult = this.rule.categorize(description, categories);
    if (ruleResult.categoryId !== null) return ruleResult;

    const historyResult = await this.history.categorize(description);
    if (historyResult.categoryId !== null) return historyResult;

    return this.ollama.categorize(description, categories);
  }
}
