import type { PrismaClient, LoyaltyTransfer as PrismaLoyaltyTransferRow } from "@prisma/client";
import type {
  ILoyaltyTransferRepository,
  LoyaltyTransferRecord,
} from "../../domain/repositories/ILoyaltyTransferRepository";

function toRecord(row: PrismaLoyaltyTransferRow): LoyaltyTransferRecord {
  return {
    id: row.id,
    fromProgramId: row.fromProgramId,
    toProgramId: row.toProgramId,
    pointsSent: row.pointsSent,
    pointsReceived: row.pointsReceived,
    costBrl:
      row.costBrl == null
        ? null
        : typeof row.costBrl === "number"
          ? row.costBrl
          : row.costBrl.toNumber(),
    transferDate: row.transferDate,
    personId: row.personId,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaLoyaltyTransferRepository implements ILoyaltyTransferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transfer: LoyaltyTransferRecord): Promise<LoyaltyTransferRecord> {
    const row = await this.prisma.loyaltyTransfer.upsert({
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
    return toRecord(row);
  }

  async findById(id: string): Promise<LoyaltyTransferRecord | null> {
    const row = await this.prisma.loyaltyTransfer.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findAll(): Promise<LoyaltyTransferRecord[]> {
    const rows = await this.prisma.loyaltyTransfer.findMany({
      orderBy: { transferDate: "desc" },
    });
    return rows.map(toRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyTransfer.delete({ where: { id } });
  }
}
