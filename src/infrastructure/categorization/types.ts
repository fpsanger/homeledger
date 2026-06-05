export type AvailableCategory = {
  categoryId: string
  label: string
}

export type CategorySuggestion = {
  categoryId: string | null
  confidence: number
  source: "rule" | "history" | "ai"
}

export interface ICategorizer {
  categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion | null>
}
