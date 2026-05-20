/**
 * Seed/import generated from Excel: TODOS OS GASTOS.xlsx
 * Source sheet analyzed: "2026"
 *
 * Important:
 * - The sheet is named 2026. The month columns were imported by position as Jan-Dec/2026.
 * - In the original workbook, May-Dec headers appear internally as 2025 dates, so this
 *   script intentionally ignores those header dates and uses the sheet position.
 * - This script replaces existing 2026 data only for the configured person:
 *   - deletes Transactions from this person with date from 2026-01-01 to 2026-12-31
 *   - deletes CreditCardPurchases from this person that have installments with dueYear = 2026
 * - Categories from Excel are mapped to existing system categories using CATEGORY_MAP.
 *
 * Usage:
 *   DATABASE_URL="postgresql://homeledger:homeledger@localhost:5433/homeledger" \
 *   npx tsx scripts/seed-from-excel-2026.ts
 */

import {
  PrismaClient,
  PaymentMethod,
  TransactionType,
  IncomeSource,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

type ImportedRow = {
  month: number;
  type: "EXPENSE" | "INCOME";
  category: string;
  amount: number;
  payment: string | null;
};

const YEAR = 2026;

// Ajuste aqui caso queira vincular tudo a outra pessoa/cartão.
const DEFAULT_PERSON_NAME = "Leo";
const DEFAULT_CREDIT_CARD_NAME = "BTG Leo";

/**
 * Mapa entre categorias vindas do Excel e categorias oficiais do sistema.
 *
 * Lado esquerdo: categoria como está no Excel.
 * Lado direito: categoria existente no sistema.
 */
const CATEGORY_MAP: Record<string, string> = {
  "Cabeleireiro / Manicure / Higiene Pessoal": "Barbeiro",
  "Conta telefone": "Internet",
  "Jantar": "Restaurantes",
  "Jogos": "Lazer",
  "Medicamentos": "Farmácia",
  "Outros": "Outras despesas",
  "Seguro do carro": "Seguro Veículo",
  "Spotify": "Assinaturas",
  "Supermercado": "Mercado",
  "Taxi/Uber": "Transporte",
  "Renda Mensal": "Salário",
  "Almoço": "Restaurantes",
  "Padaria": "Alimentação",
  "Seguro do cartão de débito": "Taxas Bancarias",
  "Vestuário / Calçados / Acessórios": "Vestuário",

  // Já existem iguais no sistema, mas ficam explícitas.
  "Combustível": "Combustível",
  "Estacionamento": "Estacionamento",
  "Krav Maga": "Krav Maga",
};

const ROWS: ImportedRow[] = [
  {
    month: 1,
    type: "EXPENSE",
    category: "Cabeleireiro / Manicure / Higiene Pessoal",
    amount: 243.0,
    payment: "transferência",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Conta telefone",
    amount: 65.0,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Estacionamento",
    amount: 13.9,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Jantar",
    amount: 141.25,
    payment: null,
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Jogos",
    amount: 26.49,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Krav Maga",
    amount: 315.0,
    payment: "transferência",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Medicamentos",
    amount: 621.43,
    payment: null,
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Outros",
    amount: 9452.86,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.88,
    payment: null,
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Spotify",
    amount: 40.9,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Supermercado",
    amount: 11.18,
    payment: "crédito",
  },
  {
    month: 1,
    type: "EXPENSE",
    category: "Taxi/Uber",
    amount: 167.72,
    payment: "crédito",
  },
  {
    month: 1,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 14780.66,
    payment: null,
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Combustível",
    amount: 120.0,
    payment: null,
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Conta telefone",
    amount: 65.0,
    payment: "crédito",
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Estacionamento",
    amount: 243.7,
    payment: "crédito",
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Krav Maga",
    amount: 330.0,
    payment: "transferência",
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Outros",
    amount: 6818.45,
    payment: "crédito",
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.88,
    payment: null,
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Spotify",
    amount: 40.9,
    payment: "crédito",
  },
  {
    month: 2,
    type: "EXPENSE",
    category: "Taxi/Uber",
    amount: 215.58,
    payment: "crédito",
  },
  {
    month: 2,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 3501.23,
    payment: null,
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Cabeleireiro / Manicure / Higiene Pessoal",
    amount: 45.0,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Conta telefone",
    amount: 65.0,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Estacionamento",
    amount: 55.6,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Krav Maga",
    amount: 330.0,
    payment: "transferência",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Outros",
    amount: 3297.64,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.88,
    payment: null,
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Spotify",
    amount: 40.9,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Taxi/Uber",
    amount: 215.58,
    payment: "crédito",
  },
  {
    month: 3,
    type: "EXPENSE",
    category: "Vestuário / Calçados / Acessórios",
    amount: 249.9,
    payment: "crédito",
  },
  {
    month: 3,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7803.74,
    payment: null,
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Almoço",
    amount: 179.99,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Cabeleireiro / Manicure / Higiene Pessoal",
    amount: 243.0,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Estacionamento",
    amount: 139.43,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Jantar",
    amount: 55.0,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Jogos",
    amount: 108.64,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Krav Maga",
    amount: 390.0,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Outros",
    amount: 2574.88,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Padaria",
    amount: 13.0,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.88,
    payment: null,
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Spotify",
    amount: 40.9,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Supermercado",
    amount: 234.62,
    payment: "crédito",
  },
  {
    month: 4,
    type: "EXPENSE",
    category: "Taxi/Uber",
    amount: 36.98,
    payment: "crédito",
  },
  {
    month: 4,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7809.45,
    payment: null,
  },
  {
    month: 5,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.24,
    payment: null,
  },
  {
    month: 5,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7468.81,
    payment: null,
  },
  {
    month: 6,
    type: "EXPENSE",
    category: "Seguro do carro",
    amount: 7.24,
    payment: null,
  },
  {
    month: 6,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7839.69,
    payment: null,
  },
  {
    month: 7,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.24,
    payment: null,
  },
  {
    month: 7,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7585.66,
    payment: null,
  },
  {
    month: 8,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.88,
    payment: null,
  },
  {
    month: 8,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7659.69,
    payment: null,
  },
  {
    month: 9,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.88,
    payment: null,
  },
  {
    month: 9,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7839.69,
    payment: null,
  },
  {
    month: 10,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.88,
    payment: null,
  },
  {
    month: 10,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 7839.69,
    payment: null,
  },
  {
    month: 11,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.88,
    payment: null,
  },
  {
    month: 11,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 13095.48,
    payment: null,
  },
  {
    month: 12,
    type: "EXPENSE",
    category: "Seguro do cartão de débito",
    amount: 7.88,
    payment: null,
  },
  {
    month: 12,
    type: "INCOME",
    category: "Renda Mensal",
    amount: 10436.96,
    payment: null,
  },
];

function normalizeCategoryName(name: string): string {
  const trimmed = name.trim();

  return CATEGORY_MAP[trimmed] ?? trimmed;
}

function mapPaymentMethod(payment: string | null): PaymentMethod {
  const normalized = payment?.trim().toLowerCase();

  switch (normalized) {
    case "crédito":
    case "credito":
      return PaymentMethod.CREDIT_CARD;

    case "débito":
    case "debito":
      return PaymentMethod.DEBIT_CARD;

    case "pix":
      return PaymentMethod.PIX;

    case "boleto":
      return PaymentMethod.BOLETO;

    case "transferência":
    case "transferencia":
      return PaymentMethod.BANK_TRANSFER;

    case "dinheiro":
      return PaymentMethod.CASH;

    default:
      return PaymentMethod.BANK_TRANSFER;
  }
}

function mapIncomeSource(categoryName: string): IncomeSource {
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  const lower = normalizedCategoryName.toLowerCase();

  if (
    lower.includes("salário") ||
    lower.includes("salario") ||
    lower.includes("renda mensal")
  ) {
    return IncomeSource.SALARY;
  }

  if (lower.includes("freelance")) return IncomeSource.FREELANCE;
  if (lower.includes("aluguel")) return IncomeSource.RENTAL;
  if (lower.includes("investimento")) return IncomeSource.INVESTMENT;
  if (lower.includes("bônus") || lower.includes("bonus")) return IncomeSource.BONUS;
  if (lower.includes("reembolso")) return IncomeSource.REIMBURSEMENT;

  return IncomeSource.OTHER;
}

function monthDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

async function findOrCreatePerson(prisma: PrismaClient, name: string) {
  const existing = await prisma.person.findFirst({
    where: { name },
  });

  if (existing) return existing;

  return prisma.person.create({
    data: {
      id: randomUUID(),
      name,
    },
  });
}

async function findOrCreateCreditCard(prisma: PrismaClient, name: string) {
  const existing = await prisma.creditCard.findFirst({
    where: { name },
  });

  if (existing) return existing;

  return prisma.creditCard.create({
    data: {
      id: randomUUID(),
      name,
      closureType: "VARIABLE",
      fixedClosureDay: null,
      dueDayOfMonth: 10,
      alwaysNextMonth: false,
    },
  });
}

/**
 * Agora essa função não deveria criar categoria nova em caso normal,
 * porque o CATEGORY_MAP deve apontar para categorias oficiais do sistema.
 *
 * Mesmo assim, ela mantém o create como fallback.
 * Caso prefira bloquear categoria desconhecida, veja a observação depois do código.
 */
async function findOrCreateCategory(prisma: PrismaClient, name: string) {
  const existing = await prisma.category.findFirst({
    where: { name },
  });

  if (existing) return existing;

  return prisma.category.create({
    data: {
      id: randomUUID(),
      name,
    },
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const startDate = new Date(Date.UTC(YEAR, 0, 1));
    const endDate = new Date(Date.UTC(YEAR + 1, 0, 1));

    console.log(`Excel rows to import: ${ROWS.length}`);
    console.log(`Target person: ${DEFAULT_PERSON_NAME}`);
    console.log(`Target credit card: ${DEFAULT_CREDIT_CARD_NAME}`);

    await prisma.$transaction(async (tx) => {
      /**
       * 1. Primeiro garante que a pessoa existe.
       * Isso é necessário porque o delete é filtrado por personId.
       */
      const person = await findOrCreatePerson(
        tx as unknown as PrismaClient,
        DEFAULT_PERSON_NAME
      );

      /**
       * 2. Deleta somente compras de cartão dessa pessoa que possuem parcelas em 2026.
       */
      const purchaseIdsToDelete = await tx.installment.findMany({
        where: {
          dueYear: YEAR,
          creditCardPurchase: {
            personId: person.id,
          },
        },
        select: {
          creditCardPurchaseId: true,
        },
        distinct: ["creditCardPurchaseId"],
      });

      const purchaseIds = purchaseIdsToDelete.map(
        (x) => x.creditCardPurchaseId
      );

      if (purchaseIds.length > 0) {
        await tx.installment.deleteMany({
          where: {
            creditCardPurchaseId: {
              in: purchaseIds,
            },
          },
        });

        await tx.creditCardPurchase.deleteMany({
          where: {
            id: {
              in: purchaseIds,
            },
            personId: person.id,
          },
        });
      }

      /**
       * 3. Deleta somente transactions de 2026 dessa pessoa.
       */
      const deletedTransactions = await tx.transaction.deleteMany({
        where: {
          personId: person.id,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      /**
       * 4. Garante que o cartão existe.
       */
      const creditCard = await findOrCreateCreditCard(
        tx as unknown as PrismaClient,
        DEFAULT_CREDIT_CARD_NAME
      );

      /**
       * 5. Garante que as categorias existem, usando o nome normalizado.
       */
      const categoryByName = new Map<string, string>();

      for (const row of ROWS) {
        const categoryName = normalizeCategoryName(row.category);

        if (!categoryByName.has(categoryName)) {
          const category = await findOrCreateCategory(
            tx as unknown as PrismaClient,
            categoryName
          );

          categoryByName.set(categoryName, category.id);
        }
      }

      /**
       * 6. Insere os dados da planilha.
       */
      let transactionsCreated = 0;
      let purchasesCreated = 0;
      let installmentsCreated = 0;

      for (const row of ROWS) {
        const categoryName = normalizeCategoryName(row.category);
        const categoryId = categoryByName.get(categoryName) ?? null;
        const date = monthDate(YEAR, row.month);
        const paymentMethod = mapPaymentMethod(row.payment);

        if (
          row.type === "EXPENSE" &&
          paymentMethod === PaymentMethod.CREDIT_CARD
        ) {
          const purchase = await tx.creditCardPurchase.create({
            data: {
              id: randomUUID(),
              personId: person.id,
              creditCardId: creditCard.id,
              description: row.category,
              totalAmount: row.amount,
              numberOfInstallments: 1,
              purchaseDate: date,
              categoryId,
            },
          });

          purchasesCreated++;

          await tx.installment.create({
            data: {
              id: randomUUID(),
              creditCardPurchaseId: purchase.id,
              installmentNumber: 1,
              amount: row.amount,
              dueYear: YEAR,
              dueMonth: row.month,
              isPaid: false,
            },
          });

          installmentsCreated++;
          continue;
        }

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            personId: person.id,
            type:
              row.type === "INCOME"
                ? TransactionType.INCOME
                : TransactionType.EXPENSE,
            amount: row.amount,
            date,
            description: row.category,
            paymentMethod,
            source:
              row.type === "INCOME" ? mapIncomeSource(row.category) : null,
            categoryId,
          },
        });

        transactionsCreated++;
      }

      console.log(
        `Deleted credit card purchases from ${DEFAULT_PERSON_NAME} with 2026 installments: ${purchaseIds.length}`
      );
      console.log(
        `Deleted transactions from ${DEFAULT_PERSON_NAME} in ${YEAR}: ${deletedTransactions.count}`
      );
      console.log(`Created transactions: ${transactionsCreated}`);
      console.log(`Created credit card purchases: ${purchasesCreated}`);
      console.log(`Created installments: ${installmentsCreated}`);
    });

    const person = await prisma.person.findFirst({
      where: {
        name: DEFAULT_PERSON_NAME,
      },
    });

    if (!person) {
      throw new Error(`Person not found after import: ${DEFAULT_PERSON_NAME}`);
    }

    const [transactions, purchases, installments] = await Promise.all([
      prisma.transaction.count({
        where: {
          personId: person.id,
          date: {
            gte: new Date(Date.UTC(YEAR, 0, 1)),
            lt: new Date(Date.UTC(YEAR + 1, 0, 1)),
          },
        },
      }),

      prisma.creditCardPurchase.count({
        where: {
          personId: person.id,
          installments: {
            some: {
              dueYear: YEAR,
            },
          },
        },
      }),

      prisma.installment.count({
        where: {
          dueYear: YEAR,
          creditCardPurchase: {
            personId: person.id,
          },
        },
      }),
    ]);

    console.log("\n=== Excel 2026 import complete ===");
    console.log(`Person: ${DEFAULT_PERSON_NAME}`);
    console.log(`Transactions in ${YEAR}: ${transactions}`);
    console.log(
      `Credit card purchases with installments in ${YEAR}: ${purchases}`
    );
    console.log(`Installments in ${YEAR}: ${installments}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});