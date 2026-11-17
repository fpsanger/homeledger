-- CreateEnum
CREATE TYPE "PendingTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISCARDED');

-- CreateTable
CREATE TABLE "PendingTransaction" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "merchant" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "creditCardId" TEXT,
    "suggestedCategoryId" TEXT,
    "status" "PendingTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PendingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingTransaction_status_occurredOn_idx" ON "PendingTransaction"("status", "occurredOn");

-- CreateIndex
CREATE UNIQUE INDEX "PendingTransaction_personId_amount_occurredAt_merchant_card_key" ON "PendingTransaction"("personId", "amount", "occurredAt", "merchant", "cardName");

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
