import type { PrismaClient } from "@prisma/client";
import type {
  CreditCardPurchaseRecord,
  CreditCardPurchaseWithInstallments,
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";

function purchaseToRecord(row: {
  id: string;
  personId: string | null;
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
  personId: string;
  installmentNumber: number;
  amount: { toNumber(): number } | number;
  dueYear: number;
  dueMonth: number;
  transactionYear: number;
  transactionMonth: number;
  isPaid: boolean;
  creditCardPurchase?: {
    categoryId: string | null;
    description?: string;
    purchaseDate?: Date;
    creditCardId?: string | null;
    numberOfInstallments?: number;
    totalAmount?: { toNumber(): number } | number;
  } | null;
}): InstallmentRecord {
  const rawTotal = row.creditCardPurchase?.totalAmount;
  return {
    id: row.id,
    creditCardPurchaseId: row.creditCardPurchaseId,
    installmentNumber: row.installmentNumber,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    dueYear: row.dueYear,
    dueMonth: row.dueMonth,
    transactionYear: row.transactionYear,
    transactionMonth: row.transactionMonth,
    isPaid: row.isPaid,
    categoryId: row.creditCardPurchase?.categoryId ?? null,
    purchaseDescription: row.creditCardPurchase?.description,
    purchaseDate: row.creditCardPurchase?.purchaseDate,
    personId: row.personId,
    creditCardId: row.creditCardPurchase?.creditCardId,
    numberOfInstallments: row.creditCardPurchase?.numberOfInstallments,
    purchaseTotalAmount:
      rawTotal == null ? undefined : typeof rawTotal === "number" ? rawTotal : rawTotal.toNumber(),
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
            personId: i.personId,
            installmentNumber: i.installmentNumber,
            amount: i.amount,
            dueYear: i.dueYear,
            dueMonth: i.dueMonth,
            transactionYear: i.transactionYear,
            transactionMonth: i.transactionMonth,
            isPaid: i.isPaid,
          })),
        },
      },
    });
    return purchaseToRecord(result);
  }

  async findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, dueMonth: month },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: {
        dueYear: year,
        dueMonth: month,
        personId,
      },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findAllInstallmentsByPurchaseMonth(
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.installment.findMany({
      where: {
        installmentNumber: 1,
        creditCardPurchase: { purchaseDate: { gte, lt } },
      },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByPurchaseMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.installment.findMany({
      where: {
        installmentNumber: 1,
        personId,
        creditCardPurchase: { purchaseDate: { gte, lt } },
      },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findAllInstallmentsByTransactionMonth(
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { transactionYear: year, transactionMonth: month },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByTransactionMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: {
        transactionYear: year,
        transactionMonth: month,
        personId,
      },
      include: {
        creditCardPurchase: {
          select: {
            categoryId: true,
            description: true,
            purchaseDate: true,
            personId: true,
            creditCardId: true,
            numberOfInstallments: true,
            totalAmount: true,
          },
        },
      },
    });
    return rows.map(installmentToRecord);
  }

  async findAllInstallmentsByYear(year: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByYear(personId: string, year: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { dueYear: year, personId },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findAllInstallmentsByTransactionYear(year: number): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { transactionYear: year },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async findInstallmentsByTransactionYear(
    personId: string,
    year: number,
  ): Promise<InstallmentRecord[]> {
    const rows = await this.prisma.installment.findMany({
      where: { transactionYear: year, personId },
      include: { creditCardPurchase: { select: { categoryId: true } } },
    });
    return rows.map(installmentToRecord);
  }

  async updatePurchase(
    id: string,
    data: Pick<
      CreditCardPurchaseRecord,
      "description" | "totalAmount" | "purchaseDate" | "categoryId" | "creditCardId"
    >,
  ): Promise<void> {
    const installments = await this.prisma.installment.findMany({
      where: { creditCardPurchaseId: id },
      orderBy: { installmentNumber: "asc" },
    });

    // A split purchase has more than one person's installment rows under the same
    // creditCardPurchaseId. Re-splitting shares after creation isn't supported yet (the API
    // layer rejects totalAmount changes on split purchases), so leave each person's installment
    // amounts untouched here and only recompute when there is a single owner.
    const isSplit = new Set(installments.map((i) => i.personId)).size > 1;
    const count = installments.length;
    const base = count > 0 ? Math.floor((data.totalAmount / count) * 100) / 100 : 0;

    if (!isSplit && count > 0 && base <= 0) {
      throw new Error("Valor total muito pequeno para o número de parcelas");
    }

    await this.prisma.$transaction([
      this.prisma.creditCardPurchase.update({
        where: { id },
        data: {
          description: data.description,
          totalAmount: data.totalAmount,
          purchaseDate: data.purchaseDate,
          categoryId: data.categoryId,
          creditCardId: data.creditCardId,
        },
      }),
      ...(isSplit
        ? []
        : installments.map((inst, i) =>
            this.prisma.installment.update({
              where: { id: inst.id },
              data: {
                amount:
                  i === count - 1
                    ? Math.round((data.totalAmount - base * (count - 1)) * 100) / 100
                    : base,
              },
            }),
          )),
    ]);
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

  async updateInstallment(
    id: string,
    fields: { amount: number; description: string },
  ): Promise<void> {
    const installment = await this.prisma.installment.findUniqueOrThrow({ where: { id } });

    // Scoped to this installment's own person, so a split purchase (multiple people,
    // each with their own installment rows for the same creditCardPurchaseId) only has
    // that one person's schedule recomputed — other people's rows are untouched.
    const allInstallments = await this.prisma.installment.findMany({
      where: {
        creditCardPurchaseId: installment.creditCardPurchaseId,
        personId: installment.personId,
      },
      orderBy: { installmentNumber: "asc" },
    });

    const toNumber = (v: { toNumber(): number } | number) =>
      typeof v === "number" ? v : v.toNumber();

    const personTotalAmount = allInstallments.reduce((sum, i) => sum + toNumber(i.amount), 0);

    const paidAmount = allInstallments
      .filter((i) => i.id !== id && i.isPaid)
      .reduce((sum, i) => sum + toNumber(i.amount), 0);

    const futureInstallments = allInstallments.filter((i) => i.id !== id && !i.isPaid);

    if (fields.amount > personTotalAmount) {
      throw new Error("O valor da parcela não pode ser maior que o total da compra");
    }

    const remainingAmount = personTotalAmount - paidAmount - fields.amount;
    const count = futureInstallments.length;
    const base = count > 0 ? Math.floor((remainingAmount / count) * 100) / 100 : 0;

    await this.prisma.$transaction([
      this.prisma.installment.update({
        where: { id },
        data: { amount: fields.amount },
      }),
      this.prisma.creditCardPurchase.update({
        where: { id: installment.creditCardPurchaseId },
        data: { description: fields.description },
      }),
      ...futureInstallments.map((inst, i) =>
        this.prisma.installment.update({
          where: { id: inst.id },
          data: {
            amount:
              i === count - 1
                ? Math.round((remainingAmount - base * (count - 1)) * 100) / 100
                : base,
          },
        }),
      ),
    ]);
  }

  async findAllPurchasesWithInstallments(
    personId?: string,
  ): Promise<CreditCardPurchaseWithInstallments[]> {
    const rows = await this.prisma.creditCardPurchase.findMany({
      where: personId ? { installments: { some: { personId } } } : undefined,
      include: { installments: true },
      orderBy: { purchaseDate: "desc" },
    });
    return rows.map((row) => ({
      ...purchaseToRecord(row),
      installments: row.installments
        .filter((i) => !personId || i.personId === personId)
        .map(installmentToRecord),
    }));
  }

  async findPurchaseById(id: string): Promise<CreditCardPurchaseRecord | null> {
    const row = await this.prisma.creditCardPurchase.findUnique({ where: { id } });
    return row ? purchaseToRecord(row) : null;
  }

  async findPurchasesByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<CreditCardPurchaseRecord[]> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.creditCardPurchase.findMany({
      where: { installments: { some: { personId } }, purchaseDate: { gte, lt } },
    });
    return rows.map(purchaseToRecord);
  }
}
