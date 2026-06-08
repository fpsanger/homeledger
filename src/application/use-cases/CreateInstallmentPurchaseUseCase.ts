import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import { isDuplicateCreditCardPurchase } from "../../domain/services/isDuplicateCreditCardPurchase";

type Input = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
};

export async function createInstallmentPurchaseUseCase(
  input: Input,
  repo: ICreditCardPurchaseRepository,
  creditCardRepo: ICreditCardRepository,
) {
  const card = await creditCardRepo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");

  let closureDay: number;
  let closureInPreviousMonth = false;
  let effectiveClosureNextMonth = card.closureNextMonth;
  if (card.closureType === "FIXED") {
    if (card.fixedClosureDay == null) throw new Error("FIXED card is missing fixedClosureDay");
    closureDay = card.fixedClosureDay;
    closureInPreviousMonth = card.fixedClosurePreviousMonth;
  } else {
    const purchaseYear = input.purchaseDate.getUTCFullYear();
    const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;

    // For previousMonth=true cards, the relevant closure falls in the purchase month
    // but is stored under the NEXT billing month's record.
    // Try next billing month first; fall back to current month (same-month closures).
    const nextBMMonth = purchaseMonth === 12 ? 1 : purchaseMonth + 1;
    const nextBMYear = purchaseMonth === 12 ? purchaseYear + 1 : purchaseYear;
    const nextClosure = await creditCardRepo.findClosure(
      input.creditCardId,
      nextBMYear,
      nextBMMonth,
    );

    if (nextClosure?.previousMonth) {
      closureDay = nextClosure.closureDay;
      closureInPreviousMonth = true;
    } else {
      const currentClosure = await creditCardRepo.findClosure(
        input.creditCardId,
        purchaseYear,
        purchaseMonth,
      );
      if (!currentClosure) {
        throw new Error(
          `No closure date set for ${card.name} in ${purchaseYear}-${String(purchaseMonth).padStart(2, "0")}. Set a closure date before registering purchases.`,
        );
      }
      closureDay = currentClosure.closureDay;
      closureInPreviousMonth = currentClosure.previousMonth;
      effectiveClosureNextMonth = card.closureNextMonth;
    }
  }

  const year = input.purchaseDate.getUTCFullYear();
  const month = input.purchaseDate.getUTCMonth() + 1;
  const existing = await repo.findPurchasesByPersonAndMonth(input.personId, year, month);
  const dateStr = input.purchaseDate.toISOString().slice(0, 10);
  const isDuplicate = isDuplicateCreditCardPurchase(existing, input.totalAmount, dateStr, input.creditCardId);

  const { purchase, installments } = createInstallmentPurchase({
    ...input,
    closureDay,
    closureInPreviousMonth,
    alwaysNextMonth: card.alwaysNextMonth,
    closureNextMonth: effectiveClosureNextMonth,
  });

  const record = await repo.save(purchase, installments);
  return { record, isDuplicate };
}
