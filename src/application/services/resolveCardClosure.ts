import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

export type ResolvedClosure = {
  closureDay: number;
  closureInPreviousMonth: boolean;
  effectiveClosureNextMonth: boolean;
};

export async function resolveClosureForDate(
  card: CreditCardRecord,
  date: Date,
  creditCardRepo: ICreditCardRepository,
): Promise<ResolvedClosure> {
  if (card.closureType === "FIXED") {
    if (card.fixedClosureDay == null) throw new Error("FIXED card is missing fixedClosureDay");
    return {
      closureDay: card.fixedClosureDay,
      closureInPreviousMonth: card.fixedClosurePreviousMonth,
      effectiveClosureNextMonth: card.closureNextMonth,
    };
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  // For previousMonth=true cards, the relevant closure falls in the purchase month
  // but is stored under the NEXT billing month's record.
  // Try next billing month first; fall back to current month (same-month closures).
  const nextBMMonth = month === 12 ? 1 : month + 1;
  const nextBMYear = month === 12 ? year + 1 : year;
  const nextClosure = await creditCardRepo.findClosure(card.id, nextBMYear, nextBMMonth);

  if (nextClosure?.previousMonth) {
    return {
      closureDay: nextClosure.closureDay,
      closureInPreviousMonth: true,
      effectiveClosureNextMonth: card.closureNextMonth,
    };
  }

  const currentClosure = await creditCardRepo.findClosure(card.id, year, month);
  if (!currentClosure) {
    throw new Error(
      `No closure date set for ${card.name} in ${year}-${String(month).padStart(2, "0")}. Set a closure date before registering purchases.`,
    );
  }
  return {
    closureDay: currentClosure.closureDay,
    closureInPreviousMonth: currentClosure.previousMonth,
    effectiveClosureNextMonth: card.closureNextMonth,
  };
}
