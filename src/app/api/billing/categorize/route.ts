import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const RequestSchema = z.object({
  items: z.array(
    z.object({
      index: z.number(),
      description: z.string(),
    }),
  ),
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      path: z.string().nullable(),
    }),
  ),
});

const SingleOllamaResponseSchema = z.object({
  categoryId: z.string().nullable(),
});

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

type AvailableCategory = {
  categoryId: string;
  label: string;
};

type Suggestion = {
  index: number;
  categoryId: string | null;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function getCandidateCategories(
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

  return categories;
}

async function categorizeOne(params: {
  ollamaBaseUrl: string;
  model: string;
  description: string;
  categories: AvailableCategory[];
}): Promise<string | null> {
  const { ollamaBaseUrl, model, description, categories } = params;

  const userContent = JSON.stringify({
    expense: {
      description,
    },
    categories,
    instruction:
      "Choose the closest category. Prefer a category over null. Return only categoryId.",
  });

  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: OLLAMA_FORMAT_SCHEMA,
      options: {
        temperature: 0,
        num_predict: 80,
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "(unreadable)");
    console.error("[categorize] ollama error", response.status, errText);
    return null;
  }

  const data = await response.json();
  const content = data?.message?.content;

  console.log("[categorize] ollama raw content:", content);

  if (!content) return null;

  let ollamaJson: unknown;

  try {
    ollamaJson = JSON.parse(content.trim());
  } catch (error) {
    console.error("[categorize] JSON.parse failed:", error, "content:", content);
    return null;
  }

  const result = SingleOllamaResponseSchema.safeParse(ollamaJson);

  if (!result.success) {
    console.error(
      "[categorize] schema mismatch:",
      result.error.issues,
      "parsed:",
      ollamaJson,
    );

    return null;
  }

  return normalizeCategoryId(result.data.categoryId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { items, categories } = parsed.data;

    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

    const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

    console.log("[categorize] using url:", ollamaBaseUrl, "model:", model);

    const availableCategories = categories.map((category) => ({
      categoryId: category.id,
      label: category.path ?? category.name,
    }));

    const validCategoryIds = new Set(
      availableCategories.map((category) => category.categoryId),
    );

    const suggestions: Suggestion[] = [];

    for (const item of items) {
      const candidateCategories = getCandidateCategories(
        item.description,
        availableCategories,
      );

      const categoriesForItem =
        candidateCategories.length > 0 ? candidateCategories : availableCategories;

      const categoryId = await categorizeOne({
        ollamaBaseUrl,
        model,
        description: item.description,
        categories: categoriesForItem,
      });

      suggestions.push({
        index: item.index,
        categoryId:
          categoryId !== null && validCategoryIds.has(categoryId)
            ? categoryId
            : null,
      });
    }

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("[categorize] unexpected error:", error);

    return NextResponse.json({ suggestions: [] });
  }
}