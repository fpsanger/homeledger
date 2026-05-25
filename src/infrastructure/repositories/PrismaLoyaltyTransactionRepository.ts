import type { PrismaClient } from "@prisma/client";
import type { ILoyaltyTransactionRepository, LoyaltyTransactionRecord } from "../../domain/repositories/ILoyaltyTransactionRepository";

export class PrismaLoyaltyTransactionRepository implements ILoyaltyTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(tx: LoyaltyTransactionRecord): Promise<LoyaltyTransactionRecord> {
    return this.prisma.loyaltyTransaction.upsert({
      where: { id: tx.id },
      create: {
        id: tx.id,
        programId: tx.programId,
        personId: tx.personId,
        transferId: tx.transferId,
        type: tx.type,
        points: tx.points,
        date: tx.date,
        description: tx.description,
        expiresAt: tx.expiresAt,
        costBrl: tx.costBrl,
        valueBrl: tx.valueBrl,
      },
      update: {
        type: tx.type,
        points: tx.points,
        date: tx.date,
        description: tx.description,
        expiresAt: tx.expiresAt,
        costBrl: tx.costBrl,
        valueBrl: tx.valueBrl,
        updatedAt: tx.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<LoyaltyTransactionRecord | null> {
    return this.prisma.loyaltyTransaction.findUnique({ where: { id } });
  }

  async findByProgramId(programId: string): Promise<LoyaltyTransactionRecord[]> {
    return this.prisma.loyaltyTransaction.findMany({
      where: { programId },
      orderBy: { date: "asc" },
    });
  }

  async findByProgramIdAndPersonId(programId: string, personId: string): Promise<LoyaltyTransactionRecord[]> {
    return this.prisma.loyaltyTransaction.findMany({
      where: { programId, personId },
      orderBy: { date: "asc" },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyTransaction.delete({ where: { id } });
  }
}
