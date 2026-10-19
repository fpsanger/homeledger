import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import {
  type BillingMonth,
  resolveFirstDueMonth,
  validateBillingMonth,
} from "../../domain/services/InstallmentPurchase";

export function resolveBillingMonth(
  card: CreditCardRecord,
  date: Date,
  billingMonth?: BillingMonth,
): BillingMonth {
  if (billingMonth) {
    validateBillingMonth(billingMonth);
    return billingMonth;
  }

  if (card.closureType === "VARIABLE") {
    throw new Error("Billing month is required for variable-closure cards");
  }
  if (card.fixedClosureDay == null) throw new Error("FIXED card is missing fixedClosureDay");

  return resolveFirstDueMonth({
    purchaseDay: date.getUTCDate(),
    purchaseYear: date.getUTCFullYear(),
    purchaseMonth: date.getUTCMonth() + 1,
    closureDay: card.fixedClosureDay,
    closureInPreviousMonth: card.fixedClosurePreviousMonth,
    closureNextMonth: card.closureNextMonth,
  });
}
