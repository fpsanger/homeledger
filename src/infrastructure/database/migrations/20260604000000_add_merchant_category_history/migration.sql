-- CreateTable
CREATE TABLE "MerchantCategoryHistory" (
    "id" TEXT NOT NULL,
    "merchantKey" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantCategoryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantCategoryHistory_merchantKey_key" ON "MerchantCategoryHistory"("merchantKey");

-- AddForeignKey
ALTER TABLE "MerchantCategoryHistory" ADD CONSTRAINT "MerchantCategoryHistory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
