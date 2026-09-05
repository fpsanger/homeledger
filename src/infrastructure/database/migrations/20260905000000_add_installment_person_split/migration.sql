-- AddColumn (nullable first, to allow backfill)
ALTER TABLE "Installment" ADD COLUMN "personId" TEXT;

-- Backfill: every existing installment inherits the owner of its purchase
UPDATE "Installment" i
SET "personId" = p."personId"
FROM "CreditCardPurchase" p
WHERE p.id = i."creditCardPurchaseId";

-- Enforce NOT NULL now that every row has a value
ALTER TABLE "Installment" ALTER COLUMN "personId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex (old unique constraint)
DROP INDEX IF EXISTS "Installment_creditCardPurchaseId_installmentNumber_key";

-- CreateIndex (new unique constraint including personId, enables per-person split rows)
CREATE UNIQUE INDEX "Installment_creditCardPurchaseId_installmentNumber_personId_key" ON "Installment"("creditCardPurchaseId", "installmentNumber", "personId");
