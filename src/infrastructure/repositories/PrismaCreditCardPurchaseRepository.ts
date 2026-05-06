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
      where: { dueYear: year, dueMonth: month },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month, creditCardPurchase: { personId } },
    });
    return rows.map(installmentToRecord);
  }

  async markInstallmentPaid(installmentId: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id: installmentId },
      data: { isPaid: true },
    });
  }

  async findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { creditCardPurchaseId: purchaseId },
    });
    return rows.map(installmentToRecord);
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
