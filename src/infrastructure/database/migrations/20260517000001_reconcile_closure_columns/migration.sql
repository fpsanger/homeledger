-- Reconcile CreditCard: replace closureMonthRelation with boolean columns
ALTER TABLE "CreditCard" DROP COLUMN IF EXISTS "closureMonthRelation";
ALTER TABLE "CreditCard" ADD COLUMN IF NOT EXISTS "alwaysNextMonth" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CreditCard" ADD COLUMN IF NOT EXISTS "closureNextMonth" BOOLEAN NOT NULL DEFAULT false;

-- Reconcile CreditCardClosure: replace closureMonthRelation with previousMonth
ALTER TABLE "CreditCardClosure" DROP COLUMN IF EXISTS "closureMonthRelation";
ALTER TABLE "CreditCardClosure" ADD COLUMN IF NOT EXISTS "previousMonth" BOOLEAN NOT NULL DEFAULT false;
