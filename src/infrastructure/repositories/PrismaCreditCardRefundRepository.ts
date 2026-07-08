import type { PrismaClient } from "@prisma/client";
import type { CreditCardRefundRecord } from "../../domain/entities/CreditCardRefund";
import type { ICreditCardRefundRepository } from "../../domain/repositories/ICreditCardRefundRepository";

function refundToRecord(row: {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: { toNumber(): number } | number;
  refundDate: Date;
  dueYear: number;
  dueMonth: number;
  categoryId: string | null;
  source: string;
  createdAt: Date;
}): CreditCardRefundRecord {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    personId: row.personId,
    description: row.description,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    refundDate: row.refundDate,
    dueYear: row.dueYear,
    dueMonth: row.dueMonth,
    categoryId: row.categoryId,
    source: row.source as CreditCardRefundRecord["source"],
    createdAt: row.createdAt,
  };
}

export class PrismaCreditCardRefundRepository implements ICreditCardRefundRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(refund: Omit<CreditCardRefundRecord, "createdAt">): Promise<CreditCardRefundRecord> {
    const result = await this.prisma.creditCardRefund.create({
      data: {
        id: refund.id,
        creditCardId: refund.creditCardId,
        personId: refund.personId,
        description: refund.description,
        amount: refund.amount,
        refundDate: refund.refundDate,
        dueYear: refund.dueYear,
        dueMonth: refund.dueMonth,
        categoryId: refund.categoryId,
        source: refund.source,
      },
    });
    return refundToRecord(result);
  }

  async findByMonth(year: number, month: number): Promise<CreditCardRefundRecord[]> {
    const rows = await this.prisma.creditCardRefund.findMany({
      where: { dueYear: year, dueMonth: month },
    });
    return rows.map(refundToRecord);
  }

  async findByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<CreditCardRefundRecord[]> {
    const rows = await this.prisma.creditCardRefund.findMany({
      where: { personId, dueYear: year, dueMonth: month },
    });
    return rows.map(refundToRecord);
  }

  async findById(id: string): Promise<CreditCardRefundRecord | null> {
    const row = await this.prisma.creditCardRefund.findUnique({ where: { id } });
    return row ? refundToRecord(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.creditCardRefund.delete({ where: { id } });
  }
}
