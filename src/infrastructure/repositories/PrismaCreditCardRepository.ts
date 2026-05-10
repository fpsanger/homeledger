import type { PrismaClient } from "@prisma/client";
import type { CreditCardClosureRecord, CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

function toRecord(row: {
  id: string;
  name: string;
  closureType: string;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  createdAt: Date;
}): CreditCardRecord {
  return {
    id: row.id,
    name: row.name,
    closureType: row.closureType as CreditCardRecord["closureType"],
    fixedClosureDay: row.fixedClosureDay,
    dueDayOfMonth: row.dueDayOfMonth,
    alwaysNextMonth: row.alwaysNextMonth,
    createdAt: row.createdAt,
  };
}

function closureToRecord(row: {
  id: string;
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
  previousMonth: boolean;
}): CreditCardClosureRecord {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    year: row.year,
    month: row.month,
    closureDay: row.closureDay,
    previousMonth: row.previousMonth,
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
        dueDayOfMonth: card.dueDayOfMonth,
        alwaysNextMonth: card.alwaysNextMonth,
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
        dueDayOfMonth: card.dueDayOfMonth,
        alwaysNextMonth: card.alwaysNextMonth,
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

  async setClosure(closure: Omit<CreditCardClosureRecord, "id">): Promise<CreditCardClosureRecord> {
    const row = await this.prisma.creditCardClosure.upsert({
      where: {
        creditCardId_year_month: {
          creditCardId: closure.creditCardId,
          year: closure.year,
          month: closure.month,
        },
      },
      create: {
        id: crypto.randomUUID(),
        creditCardId: closure.creditCardId,
        year: closure.year,
        month: closure.month,
        closureDay: closure.closureDay,
        previousMonth: closure.previousMonth,
      },
      update: { closureDay: closure.closureDay, previousMonth: closure.previousMonth },
    });
    return closureToRecord(row);
  }

  async findClosure(
    creditCardId: string,
    year: number,
    month: number,
  ): Promise<CreditCardClosureRecord | null> {
    const row = await this.prisma.creditCardClosure.findUnique({
      where: { creditCardId_year_month: { creditCardId, year, month } },
    });
    return row ? closureToRecord(row) : null;
  }

  async findClosuresByCard(creditCardId: string): Promise<CreditCardClosureRecord[]> {
    const rows = await this.prisma.creditCardClosure.findMany({
      where: { creditCardId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return rows.map(closureToRecord);
  }

  async deleteClosure(creditCardId: string, year: number, month: number): Promise<void> {
    await this.prisma.creditCardClosure.delete({
      where: { creditCardId_year_month: { creditCardId, year, month } },
    });
  }
}
