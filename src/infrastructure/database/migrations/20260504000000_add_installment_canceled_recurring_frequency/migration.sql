-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('MONTHLY');

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN "isCanceled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN "frequency" "FrequencyType" NOT NULL DEFAULT 'MONTHLY';
