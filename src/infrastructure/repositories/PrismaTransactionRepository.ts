import type { PrismaClient } from "@prisma/client";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";

function toRecord(row: {
  id: string;
  personId: string;
  type: string;
  amount: { toNumber(): number } | number;
  date: Date;
  description: string;
  paymentMethod: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TransactionRecord {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as TransactionRecord["type"],
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    date: row.date,
    description: row.description,
    paymentMethod: row.paymentMethod as TransactionRecord["paymentMethod"],
    categoryId: row.categoryId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<TransactionRecord | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByMonth(year: number, month: number): Promise<TransactionRecord[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
    });
    return rows.map(toRecord);
  }

  async findByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<TransactionRecord[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { personId, date: { gte: start, lt: end } },
    });
    return rows.map(toRecord);
  }

  async save(
    transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<TransactionRecord> {
    const row = await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id,
        personId: transaction.personId,
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        categoryId: transaction.categoryId,
      },
      update: {
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        categoryId: transaction.categoryId,
      },
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }
}
