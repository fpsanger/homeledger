ALTER TABLE "Installment" ADD COLUMN "transactionYear" INTEGER;
ALTER TABLE "Installment" ADD COLUMN "transactionMonth" INTEGER;

-- Backfill: transactionYear/Month = purchaseDate + (installmentNumber - 1) months
UPDATE "Installment" i
SET
  "transactionYear" = EXTRACT(YEAR FROM (
    DATE_TRUNC('month', p."purchaseDate") +
    (INTERVAL '1 month' * (i."installmentNumber" - 1))
  ))::INT,
  "transactionMonth" = EXTRACT(MONTH FROM (
    DATE_TRUNC('month', p."purchaseDate") +
    (INTERVAL '1 month' * (i."installmentNumber" - 1))
  ))::INT
FROM "CreditCardPurchase" p
WHERE i."creditCardPurchaseId" = p.id;

ALTER TABLE "Installment" ALTER COLUMN "transactionYear" SET NOT NULL;
ALTER TABLE "Installment" ALTER COLUMN "transactionMonth" SET NOT NULL;
