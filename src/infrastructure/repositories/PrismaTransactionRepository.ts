import type { PrismaClient } from "@prisma/client";
import type {
  ITransactionRepository,
  Transaction,
} from "../../domain/repositories/ITransactionRepository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTransaction(row: any): Transaction {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as Transaction["type"],
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    date: row.date,
    description: row.description,
    paymentMethod: (row.paymentMethod ?? null) as Transaction["paymentMethod"],
    source: (row.source ?? null) as Transaction["source"],
    categoryId: row.categoryId,
  };
}

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    return row ? toTransaction(row) : null;
  }

  async findByMonth(year: number, month: number): Promise<Transaction[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
    });
    return rows.map(toTransaction);
  }

  async findByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<Transaction[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { personId, date: { gte: start, lt: end } },
    });
    return rows.map(toTransaction);
  }

  async findByYear(year: number): Promise<Transaction[]> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
    });
    return rows.map(toTransaction);
  }

  async findByPersonAndYear(personId: string, year: number): Promise<Transaction[]> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const rows = await this.prisma.transaction.findMany({
      where: { personId, date: { gte: start, lt: end } },
    });
    return rows.map(toTransaction);
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const row = await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id,
        personId: transaction.personId,
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod ?? undefined,
        source: transaction.source ?? undefined,
        categoryId: transaction.categoryId,
      },
      update: {
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod ?? undefined,
        source: transaction.source ?? undefined,
        categoryId: transaction.categoryId,
      },
    });
    return toTransaction(row);
  }

  async update(
    id: string,
    fields: Partial<Omit<Transaction, "id">>,
  ): Promise<Transaction> {
    const row = await this.prisma.transaction.update({ where: { id }, data: fields });
    return toTransaction(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }
}
