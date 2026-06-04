export type CategorySuggestion = {
  categoryId: string | null;
  confidence: number;
  source: "rule" | "history" | "ai";
};
