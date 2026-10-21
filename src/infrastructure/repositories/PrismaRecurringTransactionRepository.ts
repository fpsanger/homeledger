import type { PrismaClient } from "@prisma/client";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../domain/repositories/IRecurringTransactionRepository";

function toRecord(row: {
  id: string;
  personId: string;
  type: string;
  amount: { toNumber(): number } | number;
  description: string;
  paymentMethod: string;
  categoryId: string | null;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RecurringTransactionRecord {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as RecurringTransactionRecord["type"],
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    description: row.description,
    paymentMethod: row.paymentMethod as RecurringTransactionRecord["paymentMethod"],
    categoryId: row.categoryId,
    frequency: row.frequency as "MONTHLY",
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaRecurringTransactionRepository implements IRecurringTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RecurringTransactionRecord | null> {
    const row = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findAll(personId?: string): Promise<RecurringTransactionRecord[]> {
    const rows = await this.prisma.recurringTransaction.findMany({
      where: personId ? { personId } : undefined,
    });
    return rows.map(toRecord);
  }

  async findActiveByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<RecurringTransactionRecord[]> {
    const targetDate = new Date(Date.UTC(year, month - 1, 1));
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        personId,
        startDate: { lte: new Date(Date.UTC(year, month, 0)) },
        OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
      },
    });
    return rows.map(toRecord);
  }

  async findAllActiveByMonth(year: number, month: number): Promise<RecurringTransactionRecord[]> {
    const targetDate = new Date(Date.UTC(year, month - 1, 1));
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        startDate: { lte: new Date(Date.UTC(year, month, 0)) },
        OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
      },
    });
    return rows.map(toRecord);
  }

  async save(
    record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    const row = await this.prisma.recurringTransaction.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        personId: record.personId,
        type: record.type,
        amount: record.amount,
        description: record.description,
        paymentMethod: record.paymentMethod,
        categoryId: record.categoryId,
        frequency: record.frequency,
        startDate: record.startDate,
        endDate: record.endDate,
      },
      update: {
        type: record.type,
        amount: record.amount,
        description: record.description,
        paymentMethod: record.paymentMethod,
        categoryId: record.categoryId,
        frequency: record.frequency,
        startDate: record.startDate,
        endDate: record.endDate,
      },
    });
    return toRecord(row);
  }

  async update(
    id: string,
    changes: Partial<
      Pick<
        RecurringTransactionRecord,
        "endDate" | "amount" | "description" | "categoryId" | "paymentMethod" | "frequency"
      >
    >,
  ): Promise<RecurringTransactionRecord> {
    const row = await this.prisma.recurringTransaction.update({
      where: { id },
      data: changes,
    });
    return toRecord(row);
  }

  async saveSplit(
    closed: Pick<RecurringTransactionRecord, "id" | "endDate">,
    next: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    const [, created] = await this.prisma.$transaction([
      this.prisma.recurringTransaction.update({
        where: { id: closed.id },
        data: { endDate: closed.endDate },
      }),
      this.prisma.recurringTransaction.create({
        data: {
          id: next.id,
          personId: next.personId,
          type: next.type,
          amount: next.amount,
          description: next.description,
          paymentMethod: next.paymentMethod,
          categoryId: next.categoryId,
          frequency: next.frequency,
          startDate: next.startDate,
          endDate: next.endDate,
        },
      }),
    ]);
    return toRecord(created);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }
}
