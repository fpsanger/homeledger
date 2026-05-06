import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

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
  if (card.closureType === "FIXED") {
    closureDay = card.fixedClosureDay!;
  } else {
    const purchaseYear = input.purchaseDate.getUTCFullYear();
    const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;
    const closure = await creditCardRepo.findClosure(input.creditCardId, purchaseYear, purchaseMonth);
    if (!closure) {
      throw new Error(
        `No closure date set for ${card.name} in ${purchaseYear}-${String(purchaseMonth).padStart(2, "0")}. Set a closure date before registering purchases.`,
      );
    }
    closureDay = closure.closureDay;
  }

  const { purchase, installments } = createInstallmentPurchase({
    ...input,
    closureDay,
    alwaysNextMonth: card.alwaysNextMonth,
  });

  return repo.save(purchase, installments);
}
