import { prisma } from "../../../infrastructure/database/client";
import { PrismaCategoryRepository } from "../../../infrastructure/repositories/PrismaCategoryRepository";
import { PrismaCreditCardPurchaseRepository } from "../../../infrastructure/repositories/PrismaCreditCardPurchaseRepository";
import { PrismaCreditCardRepository } from "../../../infrastructure/repositories/PrismaCreditCardRepository";
import { PrismaLoyaltyProgramRepository } from "../../../infrastructure/repositories/PrismaLoyaltyProgramRepository";
import { PrismaLoyaltyTransactionRepository } from "../../../infrastructure/repositories/PrismaLoyaltyTransactionRepository";
import { PrismaLoyaltyTransferRepository } from "../../../infrastructure/repositories/PrismaLoyaltyTransferRepository";
import { PrismaPersonRepository } from "../../../infrastructure/repositories/PrismaPersonRepository";
import { PrismaRecurringTransactionRepository } from "../../../infrastructure/repositories/PrismaRecurringTransactionRepository";
import { PrismaTransactionRepository } from "../../../infrastructure/repositories/PrismaTransactionRepository";

export function createRepositories() {
  return {
    person: new PrismaPersonRepository(prisma),
    category: new PrismaCategoryRepository(prisma),
    transaction: new PrismaTransactionRepository(prisma),
    creditCardPurchase: new PrismaCreditCardPurchaseRepository(prisma),
    creditCard: new PrismaCreditCardRepository(prisma),
    recurring: new PrismaRecurringTransactionRepository(prisma),
    loyaltyProgram: new PrismaLoyaltyProgramRepository(prisma),
    loyaltyTransaction: new PrismaLoyaltyTransactionRepository(prisma),
    loyaltyTransfer: new PrismaLoyaltyTransferRepository(prisma),
  };
}
