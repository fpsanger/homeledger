import type { CategorySuggestion } from "../../domain/entities/CategorySuggestion";
import type { AvailableCategory } from "./MerchantRuleCategorizer";

const OLLAMA_FORMAT_SCHEMA = {
  type: "object",
  properties: {
    categoryId: {
      type: ["string", "null"],
    },
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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeCategoryId(categoryId: string | null): string | null {
  if (categoryId === null) return null;
  const normalized = categoryId.trim();
  if (
    normalized === "" ||
    normalized.toLowerCase() === "null" ||
    normalized.toLowerCase() === "undefined"
  ) {
    return null;
  }
  return normalized;
}

export class OllamaCategorizer {
  constructor(
    private readonly ollamaBaseUrl: string,
    private readonly model: string,
  ) {}

  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion> {
    const candidateCategories = this.getCandidateCategories(
      description,
      categories,
    );
    const categoriesForItem =
      candidateCategories.length > 0 ? candidateCategories : categories;

    const categoryId = await this.callOllama(description, categoriesForItem);
    const validCategoryIds = new Set(categories.map((c) => c.categoryId));
    const resolvedId =
      categoryId !== null && validCategoryIds.has(categoryId)
        ? categoryId
        : null;

    return { categoryId: resolvedId, confidence: 0.7, source: "ai" };
  }

  private getCandidateCategories(
    description: string,
    categories: AvailableCategory[],
  ): AvailableCategory[] {
    const text = normalizeText(description);

    const matchByLabel = (keywords: string[]) => {
      const normalizedKeywords = keywords.map(normalizeText);
      return categories.filter((category) => {
        const label = normalizeText(category.label);
        return normalizedKeywords.some((keyword) => label.includes(keyword));
      });
    };

    if (text.includes("uber") || text.includes("estapar")) {
      return matchByLabel(["transporte", "carro", "estacionamento", "mobilidade"]);
    }
    if (
      text.includes("ifood") ||
      text.includes("ifd") ||
      text.includes("restaurante") ||
      text.includes("bar") ||
      text.includes("grill") ||
      text.includes("food")
    ) {
      return matchByLabel(["alimentacao", "restaurante", "delivery", "lazer"]);
    }
    if (
      text.includes("mercado") ||
      text.includes("pao de acucar") ||
      text.includes("shopper")
    ) {
      return matchByLabel(["mercado", "supermercado", "alimentacao"]);
    }
    if (
      text.includes("netflix") ||
      text.includes("spotify") ||
      text.includes("prime") ||
      text.includes("steam") ||
      text.includes("ingresso")
    ) {
      return matchByLabel([
        "assinatura",
        "streaming",
        "lazer",
        "entretenimento",
        "software",
      ]);
    }
    if (
      text.includes("sabesp") ||
      text.includes("vivo") ||
      text.includes("claro") ||
      text.includes("tim")
    ) {
      return matchByLabel([
        "contas",
        "agua",
        "telefone",
        "internet",
        "moradia",
        "habitacao",
      ]);
    }
    if (
      text.includes("droga raia") ||
      text.includes("drogasil") ||
      text.includes("farmacia") ||
      text.includes("droga")
    ) {
      return matchByLabel(["saude", "farmacia"]);
    }
    if (
      text.includes("academia") ||
      text.includes("decathlon") ||
      text.includes("esporte")
    ) {
      return matchByLabel(["saude", "academia", "esporte"]);
    }
    if (
      text.includes("amazon") ||
      text.includes("mercado livre") ||
      text.includes("renner") ||
      text.includes("casa granado")
    ) {
      return matchByLabel(["compras", "shopping", "vestuario", "casa", "lazer"]);
    }
    if (text.includes("openai") || text.includes("hubla")) {
      return matchByLabel(["educacao", "software", "assinatura", "trabalho"]);
    }
    if (text.includes("livelo")) {
      return matchByLabel(["milhas", "viagem", "assinatura"]);
    }
    if (text.includes("azos") || text.includes("seguro")) {
      return matchByLabel(["seguro", "saude", "servicos"]);
    }

    return [];
  }

  private async callOllama(
    description: string,
    categories: AvailableCategory[],
  ): Promise<string | null> {
    const userContent = JSON.stringify({
      expense: { description },
      categories,
      instruction:
        "Choose the closest category. Prefer a category over null. Return only categoryId.",
    });

    let response: Response;
    try {
      response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
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
    } catch (error) {
      console.error("[OllamaCategorizer] fetch failed:", error);
      return null;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "(unreadable)");
      console.error("[OllamaCategorizer] ollama error", response.status, errText);
      return null;
    }

    const data = await response.json();
    const content = data?.message?.content;

    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      console.error("[OllamaCategorizer] JSON parse failed, content:", content);
      return null;
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("categoryId" in parsed)
    ) {
      return null;
    }

    const categoryId = (parsed as { categoryId: unknown }).categoryId;
    if (typeof categoryId !== "string" && categoryId !== null) return null;

    return normalizeCategoryId(categoryId as string | null);
  }
}
