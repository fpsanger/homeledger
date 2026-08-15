import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import { findDuplicateCreditCardPurchase } from "../../domain/services/isDuplicateCreditCardPurchase";
import { resolveClosureForDate } from "../services/resolveCardClosure";

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

  const { closureDay, closureInPreviousMonth, effectiveClosureNextMonth } =
    await resolveClosureForDate(card, input.purchaseDate, creditCardRepo);

  const baseYear = input.purchaseDate.getUTCFullYear();
  const baseMonth = input.purchaseDate.getUTCMonth() + 1;
  const dateStr = input.purchaseDate.toISOString().slice(0, 10);

  const adjacentMonths = [-1, 0, 1].map((offset) => {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const existingArrays = await Promise.all(
    adjacentMonths.map(({ year, month }) =>
      repo.findPurchasesByPersonAndMonth(input.personId, year, month),
    ),
  );
  const existing = existingArrays.flat();
  const isDuplicate =
    findDuplicateCreditCardPurchase(existing, input.totalAmount, dateStr, input.creditCardId) !==
    null;

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
