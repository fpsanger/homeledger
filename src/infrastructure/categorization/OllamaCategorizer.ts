import type { AvailableCategory, CategorySuggestion, ICategorizer } from "./types";

const OLLAMA_FORMAT_SCHEMA = {
  type: "object",
  properties: {
    categoryId: { type: ["string", "null"] },
  },
  required: ["categoryId"],
};

const SYSTEM_PROMPT = `You are a Brazilian expense categorizer.

Return only valid JSON.

Rules:
- Choose the closest category for the expense.
- You must prefer a category over null.
- Return null only if the expense is impossible to classify.
- Return categoryId using exactly one category.categoryId from the provided categories.
- Never return the category label as categoryId.
- Do not explain anything.
- Do not use markdown.

Common examples:
- Uber, Estapar => transporte
- iFood, restaurante, bar, grill => alimentação
- mercado, pão de açúcar, shopper => mercado
- Netflix, Spotify, Steam, Prime => assinaturas, lazer or entretenimento
- Sabesp, Vivo => contas, água, telefone or internet
- Droga Raia, Drogasil => saúde or farmácia
- Academia, Decathlon => saúde, esporte or academia

Output:
{"categoryId":"one-category-id"}`;

function normalizeCategoryId(categoryId: string | null): string | null {
  if (categoryId === null) return null;
  const normalized = categoryId.trim();
  if (
    !normalized ||
    normalized.toLowerCase() === "null" ||
    normalized.toLowerCase() === "undefined"
  )
    return null;
  return normalized;
}

export class OllamaCategorizer implements ICategorizer {
  constructor(
    private readonly ollamaBaseUrl: string,
    private readonly model: string,
  ) {}

  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion | null> {
    const userContent = JSON.stringify({
      expense: { description },
      categories,
      instruction:
        "Choose the closest category. Prefer a category over null. Return only categoryId.",
    });

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: OLLAMA_FORMAT_SCHEMA,
          options: { temperature: 0, num_predict: 80 },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const content = data?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content.trim());
      const categoryId = normalizeCategoryId(parsed?.categoryId ?? null);
      if (!categoryId) return { categoryId: null, confidence: 0, source: "ai" };

      return { categoryId, confidence: 0.7, source: "ai" };
    } catch {
      return null;
    }
  }
}
