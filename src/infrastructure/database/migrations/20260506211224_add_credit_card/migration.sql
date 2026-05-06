-- CreateEnum
CREATE TYPE "ClosureType" AS ENUM ('FIXED', 'VARIABLE');

-- AlterTable
ALTER TABLE "CreditCardPurchase" ADD COLUMN     "creditCardId" TEXT;

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "closureType" "ClosureType" NOT NULL,
    "fixedClosureDay" INTEGER,
    "dueDayOfMonth" INTEGER NOT NULL,
    "alwaysNextMonth" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCardClosure" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "closureDay" INTEGER NOT NULL,

    CONSTRAINT "CreditCardClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardClosure_creditCardId_year_month_key" ON "CreditCardClosure"("creditCardId", "year", "month");

-- AddForeignKey
ALTER TABLE "CreditCardClosure" ADD CONSTRAINT "CreditCardClosure_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
