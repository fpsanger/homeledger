import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CategorizationPipeline } from "../../../../infrastructure/categorization/CategorizationPipeline"
import { MerchantHistoryCategorizer } from "../../../../infrastructure/categorization/MerchantHistoryCategorizer"
import { MerchantRuleCategorizer } from "../../../../infrastructure/categorization/MerchantRuleCategorizer"
import { OllamaCategorizer } from "../../../../infrastructure/categorization/OllamaCategorizer"

export const runtime = "nodejs"

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
})

type Suggestion = {
  index: number
  categoryId: string | null
  source: "rule" | "history" | "ai"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      )
    }

    const { items, categories } = parsed.data

    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
    const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b"

    const availableCategories = categories.map((c) => ({
      categoryId: c.id,
      label: c.path ?? c.name,
    }))

    const validCategoryIds = new Set(availableCategories.map((c) => c.categoryId))

    const pipeline = new CategorizationPipeline([
      new MerchantRuleCategorizer(),
      new MerchantHistoryCategorizer(),
      new OllamaCategorizer(ollamaBaseUrl, model),
    ])

    const suggestions: Suggestion[] = []

    for (const item of items) {
      const result = await pipeline.categorize(item.description, availableCategories)
      const categoryId =
        result.categoryId !== null && validCategoryIds.has(result.categoryId)
          ? result.categoryId
          : null

      suggestions.push({ index: item.index, categoryId, source: result.source })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("[categorize] unexpected error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
