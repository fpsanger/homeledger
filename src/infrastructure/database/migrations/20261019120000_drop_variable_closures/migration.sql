-- VARIABLE cards no longer use per-month closure dates: the user picks the billing month
-- on each purchase. Existing installments keep their stored dueYear/dueMonth.
DROP TABLE "CreditCardClosure";

ALTER TABLE "CreditCard" DROP COLUMN "alwaysNextMonth";
