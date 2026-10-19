import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import {
  type BillingMonth,
  createInstallmentPurchase,
  createSplitInstallmentPurchase,
  type PurchaseSplitInput,
} from "../../domain/services/InstallmentPurchase";
import { findDuplicateCreditCardPurchase } from "../../domain/services/isDuplicateCreditCardPurchase";
import { resolveBillingMonth } from "../services/resolveBillingMonth";

type SharedInput = {
  id: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
  billingMonth?: BillingMonth;
};

type Input = SharedInput &
  (
    | { personId: string; splits?: undefined }
    | { splits: PurchaseSplitInput[]; personId?: undefined }
  );

async function findExistingPurchasesForPerson(
  personId: string,
  purchaseDate: Date,
  repo: ICreditCardPurchaseRepository,
) {
  const baseYear = purchaseDate.getUTCFullYear();
  const baseMonth = purchaseDate.getUTCMonth() + 1;

  const adjacentMonths = [-1, 0, 1].map((offset) => {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const existingArrays = await Promise.all(
    adjacentMonths.map(({ year, month }) =>
      repo.findPurchasesByPersonAndMonth(personId, year, month),
    ),
  );
  return existingArrays.flat();
}

export async function createInstallmentPurchaseUseCase(
  input: Input,
  repo: ICreditCardPurchaseRepository,
  creditCardRepo: ICreditCardRepository,
) {
  const card = await creditCardRepo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");

  const firstDue = resolveBillingMonth(card, input.purchaseDate, input.billingMonth);

  const dateStr = input.purchaseDate.toISOString().slice(0, 10);
  const peopleToCheck = input.splits ? input.splits.map((s) => s.personId) : [input.personId];

  const existingByPerson = await Promise.all(
    peopleToCheck.map((personId) =>
      findExistingPurchasesForPerson(personId, input.purchaseDate, repo),
    ),
  );
  const existing = existingByPerson.flat();
  const isDuplicate =
    findDuplicateCreditCardPurchase(existing, input.totalAmount, dateStr, input.creditCardId) !==
    null;

  const { purchase, installments } = input.splits
    ? createSplitInstallmentPurchase({ ...input, splits: input.splits, firstDue })
    : createInstallmentPurchase({ ...input, personId: input.personId, firstDue });

  const record = await repo.save(purchase, installments);
  return { record, isDuplicate };
}
