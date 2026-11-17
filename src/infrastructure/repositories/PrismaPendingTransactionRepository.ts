import type {
  PrismaClient,
  PendingTransaction as PrismaPendingTransactionRow,
} from "@prisma/client";
import type {
  PendingTransactionRecord,
  PendingTransactionStatus,
} from "../../domain/entities/PendingTransaction";
import type { IPendingTransactionRepository } from "../../domain/repositories/IPendingTransactionRepository";

function toRecord(row: PrismaPendingTransactionRow): PendingTransactionRecord {
  return {
    id: row.id,
    personId: row.personId,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    occurredAt: row.occurredAt,
    occurredOn: row.occurredOn,
    merchant: row.merchant,
    cardName: row.cardName,
    creditCardId: row.creditCardId,
    suggestedCategoryId: row.suggestedCategoryId,
    status: row.status as PendingTransactionStatus,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as { code: string }).code === "P2002";
}

export class PrismaPendingTransactionRepository implements IPendingTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveIfNew(
    record: PendingTransactionRecord,
  ): Promise<{ record: PendingTransactionRecord; created: boolean }> {
    const identity = {
      personId: record.personId,
      amount: record.amount,
      occurredAt: record.occurredAt,
      merchant: record.merchant,
      cardName: record.cardName,
    };

    try {
      const row = await this.prisma.pendingTransaction.create({
        data: {
          ...identity,
          id: record.id,
          occurredOn: record.occurredOn,
          creditCardId: record.creditCardId,
          suggestedCategoryId: record.suggestedCategoryId,
          status: record.status,
        },
      });
      return { record: toRecord(row), created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existing = await this.prisma.pendingTransaction.findFirst({ where: identity });
      if (!existing) throw error;
      return { record: toRecord(existing), created: false };
    }
  }

  async findById(id: string): Promise<PendingTransactionRecord | null> {
    const row = await this.prisma.pendingTransaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findPending(): Promise<PendingTransactionRecord[]> {
    const rows = await this.prisma.pendingTransaction.findMany({
      where: { status: "PENDING" },
      orderBy: { occurredAt: "desc" },
    });
    return rows.map(toRecord);
  }

  async resolve(id: string, status: "CONFIRMED" | "DISCARDED", at: Date): Promise<boolean> {
    const { count } = await this.prisma.pendingTransaction.updateMany({
      where: { id, status: "PENDING" },
      data: { status, resolvedAt: at },
    });
    return count > 0;
  }

  async reopen(id: string): Promise<void> {
    await this.prisma.pendingTransaction.updateMany({
      where: { id },
      data: { status: "PENDING", resolvedAt: null },
    });
  }
}
