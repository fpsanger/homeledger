import type { PrismaClient } from "@prisma/client";
import type { ILoyaltyTransferRepository, LoyaltyTransferRecord } from "../../domain/repositories/ILoyaltyTransferRepository";

export class PrismaLoyaltyTransferRepository implements ILoyaltyTransferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transfer: LoyaltyTransferRecord): Promise<LoyaltyTransferRecord> {
    return this.prisma.loyaltyTransfer.upsert({
      where: { id: transfer.id },
      create: {
        id: transfer.id,
        fromProgramId: transfer.fromProgramId,
        toProgramId: transfer.toProgramId,
        pointsSent: transfer.pointsSent,
        pointsReceived: transfer.pointsReceived,
        costBrl: transfer.costBrl,
        transferDate: transfer.transferDate,
        personId: transfer.personId,
        description: transfer.description,
      },
      update: {
        pointsSent: transfer.pointsSent,
        pointsReceived: transfer.pointsReceived,
        costBrl: transfer.costBrl,
        transferDate: transfer.transferDate,
        personId: transfer.personId,
        description: transfer.description,
        updatedAt: transfer.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<LoyaltyTransferRecord | null> {
    return this.prisma.loyaltyTransfer.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyTransfer.delete({ where: { id } });
  }
}
