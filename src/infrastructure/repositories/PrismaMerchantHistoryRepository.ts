import type { PrismaClient } from "@prisma/client";
import type { IMerchantHistoryRepository } from "../../domain/repositories/IMerchantHistoryRepository";

export class PrismaMerchantHistoryRepository
  implements IMerchantHistoryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findByMerchantKey(
    key: string,
  ): Promise<{ categoryId: string; usageCount: number } | null> {
    const record = await this.prisma.merchantCategoryHistory.findUnique({
      where: { merchantKey: key },
      select: { categoryId: true, usageCount: true },
    });
    return record;
  }

  async upsert(merchantKey: string, categoryId: string): Promise<void> {
    await this.prisma.merchantCategoryHistory.upsert({
      where: { merchantKey },
      create: { merchantKey, categoryId, usageCount: 1 },
      update: {
        categoryId,
        usageCount: { increment: 1 },
      },
    });
  }
}
