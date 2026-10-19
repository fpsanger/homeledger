import type { PrismaClient } from "@prisma/client";
import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

function toRecord(row: {
  id: string;
  name: string;
  closureType: string;
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  closureNextMonth: boolean;
  createdAt: Date;
}): CreditCardRecord {
  return {
    id: row.id,
    name: row.name,
    closureType: row.closureType as CreditCardRecord["closureType"],
    fixedClosureDay: row.fixedClosureDay,
    fixedClosurePreviousMonth: row.fixedClosurePreviousMonth,
    dueDayOfMonth: row.dueDayOfMonth,
    closureNextMonth: row.closureNextMonth,
    createdAt: row.createdAt,
  };
}

export class PrismaCreditCardRepository implements ICreditCardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord> {
    const row = await this.prisma.creditCard.create({
      data: {
        id: card.id,
        name: card.name,
        closureType: card.closureType,
        fixedClosureDay: card.fixedClosureDay,
        fixedClosurePreviousMonth: card.fixedClosurePreviousMonth,
        dueDayOfMonth: card.dueDayOfMonth,
        closureNextMonth: card.closureNextMonth,
      },
    });
    return toRecord(row);
  }

  async update(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord> {
    const row = await this.prisma.creditCard.update({
      where: { id: card.id },
      data: {
        name: card.name,
        closureType: card.closureType,
        fixedClosureDay: card.fixedClosureDay,
        fixedClosurePreviousMonth: card.fixedClosurePreviousMonth,
        dueDayOfMonth: card.dueDayOfMonth,
        closureNextMonth: card.closureNextMonth,
      },
    });
    return toRecord(row);
  }

  async findById(id: string): Promise<CreditCardRecord | null> {
    const row = await this.prisma.creditCard.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findAll(): Promise<CreditCardRecord[]> {
    const rows = await this.prisma.creditCard.findMany({ orderBy: { name: "asc" } });
    return rows.map(toRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.creditCard.delete({ where: { id } });
  }

  async hasPurchases(id: string): Promise<boolean> {
    const count = await this.prisma.creditCardPurchase.count({
      where: { creditCardId: { equals: id } },
    });
    return count > 0;
  }
}
