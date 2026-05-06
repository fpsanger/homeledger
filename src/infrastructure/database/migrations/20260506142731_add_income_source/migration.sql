-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('SALARY', 'FREELANCE', 'RENTAL', 'INVESTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "source" "IncomeSource",
ALTER COLUMN "paymentMethod" DROP NOT NULL;
