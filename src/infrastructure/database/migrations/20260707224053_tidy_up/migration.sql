/*
  Warnings:

  - You are about to alter the column `points` on the `LoyaltyTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `costBrl` on the `LoyaltyTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `valueBrl` on the `LoyaltyTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `pointsSent` on the `LoyaltyTransfer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `pointsReceived` on the `LoyaltyTransfer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `costBrl` on the `LoyaltyTransfer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.

*/
-- DropForeignKey
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_transferId_fkey";

-- AlterTable
ALTER TABLE "LoyaltyTransaction" ALTER COLUMN "points" SET DATA TYPE INTEGER,
ALTER COLUMN "costBrl" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "valueBrl" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "LoyaltyTransfer" ALTER COLUMN "pointsSent" SET DATA TYPE INTEGER,
ALTER COLUMN "pointsReceived" SET DATA TYPE INTEGER,
ALTER COLUMN "costBrl" SET DATA TYPE DECIMAL(15,2);

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "LoyaltyTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
