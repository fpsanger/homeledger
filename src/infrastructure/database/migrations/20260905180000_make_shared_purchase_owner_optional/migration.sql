-- Split purchases are owned by their installment rows, not by an arbitrary first participant.
ALTER TABLE "CreditCardPurchase" ALTER COLUMN "personId" DROP NOT NULL;

-- Repair split purchases created before this migration, when the first participant was stored
-- as the owner. Without this backfill, deleting that person would still cascade to every split.
UPDATE "CreditCardPurchase" AS p
SET "personId" = NULL
FROM (
  SELECT i."creditCardPurchaseId"
  FROM "Installment" AS i
  GROUP BY i."creditCardPurchaseId"
  HAVING COUNT(DISTINCT i."personId") > 1
) AS split_purchase
WHERE p.id = split_purchase."creditCardPurchaseId";
