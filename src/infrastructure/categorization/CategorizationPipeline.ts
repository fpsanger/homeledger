import type { AvailableCategory, CategorySuggestion, ICategorizer } from "./types";

export class CategorizationPipeline {
  private readonly categorizers: ICategorizer[];

  constructor(categorizers: ICategorizer[]) {
    this.categorizers = categorizers;
  }

  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion> {
    for (const categorizer of this.categorizers) {
      const result = await categorizer.categorize(description, categories);
      if (result && result.categoryId !== null) return result;
    }
    return { categoryId: null, confidence: 0, source: "ai" };
  }
}
