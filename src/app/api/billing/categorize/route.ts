import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../infrastructure/database/client";
import { CategorizationPipeline } from "../../../../infrastructure/categorization/CategorizationPipeline";
import { MerchantRuleCategorizer } from "../../../../infrastructure/categorization/MerchantRuleCategorizer";
import { MerchantHistoryCategorizer } from "../../../../infrastructure/categorization/MerchantHistoryCategorizer";
import { OllamaCategorizer } from "../../../../infrastructure/categorization/OllamaCategorizer";
import { PrismaMerchantHistoryRepository } from "../../../../infrastructure/repositories/PrismaMerchantHistoryRepository";

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

type Suggestion = {
  index: number;
  categoryId: string | null;
  source: "rule" | "history" | "ai";
};

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

    const availableCategories = categories.map((category) => ({
      categoryId: category.id,
      label: category.path ?? category.name,
    }));

    const merchantHistoryRepo = new PrismaMerchantHistoryRepository(prisma);

    const pipeline = new CategorizationPipeline(
      new MerchantRuleCategorizer(),
      new MerchantHistoryCategorizer(merchantHistoryRepo),
      new OllamaCategorizer(ollamaBaseUrl, model),
    );

    const suggestions: Suggestion[] = [];

    for (const item of items) {
      const suggestion = await pipeline.categorize(
        item.description,
        availableCategories,
      );

      suggestions.push({
        index: item.index,
        categoryId: suggestion.categoryId,
        source: suggestion.source,
      });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[categorize] unexpected error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
