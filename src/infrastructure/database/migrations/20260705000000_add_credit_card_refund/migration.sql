-- CreateEnum
CREATE TYPE "RefundSource" AS ENUM ('MANUAL', 'IMPORT');

-- CreateTable
CREATE TABLE "CreditCardRefund" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "refundDate" TIMESTAMP(3) NOT NULL,
    "dueYear" INTEGER NOT NULL,
    "dueMonth" INTEGER NOT NULL,
    "categoryId" TEXT,
    "source" "RefundSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCardRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditCardRefund_creditCardId_dueYear_dueMonth_idx" ON "CreditCardRefund"("creditCardId", "dueYear", "dueMonth");

-- AddForeignKey
ALTER TABLE "CreditCardRefund" ADD CONSTRAINT "CreditCardRefund_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardRefund" ADD CONSTRAINT "CreditCardRefund_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardRefund" ADD CONSTRAINT "CreditCardRefund_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
