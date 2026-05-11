import type { PrismaClient } from "@prisma/client";
import type {
  CreditCardPurchaseRecord,
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";

function purchaseToRecord(row: {
  id: string;
  personId: string;
  creditCardId: string | null;
  description: string;
  totalAmount: { toNumber(): number } | number;
  numberOfInstallments: number;
  purchaseDate: Date;
  categoryId: string | null;
  createdAt: Date;
}): CreditCardPurchaseRecord {
  return {
    id: row.id,
    personId: row.personId,
    creditCardId: row.creditCardId ?? null,
    description: row.description,
    totalAmount: typeof row.totalAmount === "number" ? row.totalAmount : row.totalAmount.toNumber(),
    numberOfInstallments: row.numberOfInstallments,
    purchaseDate: row.purchaseDate,
    categoryId: row.categoryId,
    createdAt: row.createdAt,
  };
}

function installmentToRecord(row: {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: { toNumber(): number } | number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
  creditCardPurchase?: {
    categoryId: string | null;
    description?: string;
    purchaseDate?: Date;
    personId?: string;
    creditCardId?: string | null;
    numberOfInstallments?: number;
  } | null;
}): InstallmentRecord {
  return {
    id: row.id,
    creditCardPurchaseId: row.creditCardPurchaseId,
    installmentNumber: row.installmentNumber,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    dueYear: row.dueYear,
    dueMonth: row.dueMonth,
    isPaid: row.isPaid,
    isCanceled: row.isCanceled,
    categoryId: row.creditCardPurchase?.categoryId ?? null,
    purchaseDescription: row.creditCardPurchase?.description,
    purchaseDate: row.creditCardPurchase?.purchaseDate,
    personId: row.creditCardPurchase?.personId,
    creditCardId: row.creditCardPurchase?.creditCardId,
    numberOfInstallments: row.creditCardPurchase?.numberOfInstallments,
  };
}

export class PrismaCreditCardPurchaseRepository implements ICreditCardPurchaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord> {
    const result = await this.prisma.creditCardPurchase.create({
      data: {
        id: purchase.id,
        personId: purchase.personId,
        creditCardId: purchase.creditCardId,
        description: purchase.description,
        totalAmount: purchase.totalAmount,
        numberOfInstallments: purchase.numberOfInstallments,
        purchaseDate: purchase.purchaseDate,
        categoryId: purchase.categoryId,
        installments: {
          create: installments.map((i) => ({
            installmentNumber: i.installmentNumber,
            amount: i.amount,
            dueYear: i.dueYear,
            dueMonth: i.dueMonth,
            isPaid: i.isPaid,
            isCanceled: i.isCanceled,
          })),
        },
      },
    });
    return purchaseToRecord(result);
  }

  async findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month, isCanceled: false },
      include: { creditCardPurchase: { select: { categoryId: true, description: true, purchaseDate: true, personId: true, creditCardId: true, numberOfInstallments: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month, isCanceled: false, creditCardPurchase: { personId } },
      include: { creditCardPurchase: { select: { categoryId: true, description: true, purchaseDate: true, personId: true, creditCardId: true, numberOfInstallments: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findAllInstallmentsByYear(year: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, isCanceled: false },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByYear(personId: string, year: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, isCanceled: false, creditCardPurchase: { personId } },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async updatePurchase(
    id: string,
    data: Pick<CreditCardPurchaseRecord, "description" | "totalAmount" | "purchaseDate" | "categoryId" | "creditCardId">,
  ): Promise<void> {
    await this.prisma.creditCardPurchase.update({
      where: { id },
      data: {
        description: data.description,
        totalAmount: data.totalAmount,
        purchaseDate: data.purchaseDate,
        categoryId: data.categoryId,
        creditCardId: data.creditCardId,
      },
    });
  }

  async deletePurchase(id: string): Promise<void> {
    await this.prisma.creditCardPurchase.delete({ where: { id } });
  }

  async markInstallmentPaid(installmentId: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id: installmentId },
      data: { isPaid: true },
    });
  }

  async markInstallmentsPaid(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.installment.updateMany({
      where: { id: { in: ids }, isPaid: false },
      data: { isPaid: true },
    });
  }

  async markInstallmentsUnpaid(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.installment.updateMany({
      where: { id: { in: ids }, isPaid: true },
      data: { isPaid: false },
    });
  }

  async deleteInstallment(installmentId: string): Promise<void> {
    await this.prisma.installment.delete({ where: { id: installmentId } });
  }

  async findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { creditCardPurchaseId: purchaseId },
    });
    return rows.map(installmentToRecord);
  }

  async updateInstallment(id: string, fields: { amount: number; description: string }): Promise<void> {
    const installment = await this.prisma.installment.findUniqueOrThrow({ where: { id } });
    await this.prisma.$transaction([
      this.prisma.installment.update({
        where: { id },
        data: { amount: fields.amount },
      }),
      this.prisma.creditCardPurchase.update({
        where: { id: installment.creditCardPurchaseId },
        data: { description: fields.description },
      }),
    ]);
  }

  async updateInstallments(installments: InstallmentRecord[]): Promise<void> {
    await this.prisma.$transaction(
      installments.map((i) =>
        this.prisma.installment.update({
          where: { id: i.id },
          data: { isPaid: i.isPaid, isCanceled: i.isCanceled },
        }),
      ),
    );
  }

  async findAllPurchasesWithInstallments(
    personId?: string,
  ): Promise<CreditCardPurchaseWithInstallments[]> {
    const rows = await this.prisma.creditCardPurchase.findMany({
      where: personId ? { personId } : undefined,
      include: { installments: true },
      orderBy: { purchaseDate: "desc" },
    });
    return rows.map((row) => ({
      ...purchaseToRecord(row),
      installments: row.installments.map(installmentToRecord),
    }));
  }
}
