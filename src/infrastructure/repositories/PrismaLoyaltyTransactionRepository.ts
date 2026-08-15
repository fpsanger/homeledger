import type { PrismaClient } from "@prisma/client";
import type {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionRecord,
} from "../../domain/repositories/ILoyaltyTransactionRepository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(row: any): LoyaltyTransactionRecord {
  return {
    id: row.id,
    programId: row.programId,
    personId: row.personId,
    transferId: row.transferId,
    type: row.type as LoyaltyTransactionRecord["type"],
    points: row.points,
    date: row.date,
    description: row.description,
    expiresAt: row.expiresAt,
    costBrl:
      row.costBrl == null
        ? null
        : typeof row.costBrl === "number"
          ? row.costBrl
          : row.costBrl.toNumber(),
    valueBrl:
      row.valueBrl == null
        ? null
        : typeof row.valueBrl === "number"
          ? row.valueBrl
          : row.valueBrl.toNumber(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaLoyaltyTransactionRepository implements ILoyaltyTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(tx: LoyaltyTransactionRecord): Promise<LoyaltyTransactionRecord> {
    const row = await this.prisma.loyaltyTransaction.upsert({
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
    return toRecord(row);
  }

  async findById(id: string): Promise<LoyaltyTransactionRecord | null> {
    const row = await this.prisma.loyaltyTransaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByProgramId(programId: string): Promise<LoyaltyTransactionRecord[]> {
    const rows = await this.prisma.loyaltyTransaction.findMany({
      where: { programId },
      orderBy: { date: "asc" },
    });
    return rows.map(toRecord);
  }

  async findByProgramIdAndPersonId(
    programId: string,
    personId: string,
  ): Promise<LoyaltyTransactionRecord[]> {
    const rows = await this.prisma.loyaltyTransaction.findMany({
      where: { programId, OR: [{ personId }, { personId: null }] },
      orderBy: { date: "asc" },
    });
    return rows.map(toRecord);
  }

  async findByTransferId(transferId: string): Promise<LoyaltyTransactionRecord[]> {
    const rows = await this.prisma.loyaltyTransaction.findMany({
      where: { transferId },
    });
    return rows.map(toRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyTransaction.delete({ where: { id } });
  }
}
