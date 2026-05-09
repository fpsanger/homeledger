import { prisma } from "../../../infrastructure/database/client";
import { PrismaCategoryRepository } from "../../../infrastructure/repositories/PrismaCategoryRepository";
import { PrismaCreditCardPurchaseRepository } from "../../../infrastructure/repositories/PrismaCreditCardPurchaseRepository";
import { PrismaPersonRepository } from "../../../infrastructure/repositories/PrismaPersonRepository";
import { PrismaRecurringTransactionRepository } from "../../../infrastructure/repositories/PrismaRecurringTransactionRepository";
import { PrismaTransactionRepository } from "../../../infrastructure/repositories/PrismaTransactionRepository";

export function createRepositories() {
  return {
    person: new PrismaPersonRepository(prisma),
    category: new PrismaCategoryRepository(prisma),
    transaction: new PrismaTransactionRepository(prisma),
    creditCard: new PrismaCreditCardPurchaseRepository(prisma),
    recurring: new PrismaRecurringTransactionRepository(prisma),
  };
}
