import { prisma } from "../database/client"
import { normalizeText } from "./MerchantRuleCategorizer"
import type { AvailableCategory, CategorySuggestion, ICategorizer } from "./types"

export class MerchantHistoryCategorizer implements ICategorizer {
  async categorize(
    description: string,
    categories: AvailableCategory[],
  ): Promise<CategorySuggestion | null> {
    const merchantKey = normalizeText(description)
    const validCategoryIds = new Set(categories.map((c) => c.categoryId))

    const record = await prisma.merchantCategoryHistory.findUnique({
      where: { merchantKey },
    })

    if (!record) return null
    if (!validCategoryIds.has(record.categoryId)) return null

    await prisma.merchantCategoryHistory.update({
      where: { merchantKey },
      data: { usageCount: { increment: 1 } },
    })

    return { categoryId: record.categoryId, confidence: 0.9, source: "history" }
  }
}

export async function upsertMerchantHistory(
  description: string,
  categoryId: string,
): Promise<void> {
  const merchantKey = normalizeText(description)
  await prisma.merchantCategoryHistory.upsert({
    where: { merchantKey },
    create: { merchantKey, categoryId, usageCount: 1 },
    update: { categoryId, usageCount: { increment: 1 } },
  })
}
