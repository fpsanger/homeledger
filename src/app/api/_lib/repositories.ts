import { MerchantCategoryMemory } from "../../../infrastructure/categorization/MerchantCategoryMemory";
import {
  MerchantHistoryCategorizer,
  upsertMerchantHistory,
} from "../../../infrastructure/categorization/MerchantHistoryCategorizer";
import { MerchantRuleCategorizer } from "../../../infrastructure/categorization/MerchantRuleCategorizer";
import { prisma } from "../../../infrastructure/database/client";
import { PrismaCategoryRepository } from "../../../infrastructure/repositories/PrismaCategoryRepository";
import { PrismaCreditCardPurchaseRepository } from "../../../infrastructure/repositories/PrismaCreditCardPurchaseRepository";
import { PrismaCreditCardRefundRepository } from "../../../infrastructure/repositories/PrismaCreditCardRefundRepository";
import { PrismaCreditCardRepository } from "../../../infrastructure/repositories/PrismaCreditCardRepository";
import { PrismaLoyaltyProgramRepository } from "../../../infrastructure/repositories/PrismaLoyaltyProgramRepository";
import { PrismaLoyaltyTransactionRepository } from "../../../infrastructure/repositories/PrismaLoyaltyTransactionRepository";
import { PrismaLoyaltyTransferRepository } from "../../../infrastructure/repositories/PrismaLoyaltyTransferRepository";
import { PrismaPendingTransactionRepository } from "../../../infrastructure/repositories/PrismaPendingTransactionRepository";
import { PrismaPersonRepository } from "../../../infrastructure/repositories/PrismaPersonRepository";
import { PrismaRecurringTransactionRepository } from "../../../infrastructure/repositories/PrismaRecurringTransactionRepository";
import { PrismaTransactionRepository } from "../../../infrastructure/repositories/PrismaTransactionRepository";
import { PrismaWebhookTokenRepository } from "../../../infrastructure/repositories/PrismaWebhookTokenRepository";

export function createRepositories() {
  const category = new PrismaCategoryRepository(prisma);

  return {
    person: new PrismaPersonRepository(prisma),
    category,
    pendingTransaction: new PrismaPendingTransactionRepository(prisma),
    webhookToken: new PrismaWebhookTokenRepository(prisma),
    categoryMemory: new MerchantCategoryMemory(
      category,
      [new MerchantRuleCategorizer(), new MerchantHistoryCategorizer()],
      upsertMerchantHistory,
    ),
    transaction: new PrismaTransactionRepository(prisma),
    creditCardPurchase: new PrismaCreditCardPurchaseRepository(prisma),
    creditCardRefund: new PrismaCreditCardRefundRepository(prisma),
    creditCard: new PrismaCreditCardRepository(prisma),
    recurring: new PrismaRecurringTransactionRepository(prisma),
    loyaltyProgram: new PrismaLoyaltyProgramRepository(prisma),
    loyaltyTransaction: new PrismaLoyaltyTransactionRepository(prisma),
    loyaltyTransfer: new PrismaLoyaltyTransferRepository(prisma),
  };
}
