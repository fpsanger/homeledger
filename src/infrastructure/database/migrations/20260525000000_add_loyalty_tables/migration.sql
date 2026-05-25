-- CreateEnum
CREATE TYPE "LoyaltyProgramType" AS ENUM ('AIRLINE', 'HOTEL', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('PURCHASE', 'EARN', 'BONUS', 'REDEEM', 'TRANSFER_OUT', 'TRANSFER_IN', 'EXPIRE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LoyaltyProgramType" NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransfer" (
    "id" TEXT NOT NULL,
    "fromProgramId" TEXT NOT NULL,
    "toProgramId" TEXT NOT NULL,
    "pointsSent" DOUBLE PRECISION NOT NULL,
    "pointsReceived" DOUBLE PRECISION NOT NULL,
    "costBrl" DOUBLE PRECISION,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "personId" TEXT,
    "transferId" TEXT,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "costBrl" DOUBLE PRECISION,
    "valueBrl" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LoyaltyTransfer" ADD CONSTRAINT "LoyaltyTransfer_fromProgramId_fkey" FOREIGN KEY ("fromProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransfer" ADD CONSTRAINT "LoyaltyTransfer_toProgramId_fkey" FOREIGN KEY ("toProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransfer" ADD CONSTRAINT "LoyaltyTransfer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "LoyaltyTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
