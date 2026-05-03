import { createInstallmentPurchase } from "../../domain/services/InstallmentPurchase";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";

type Input = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

export async function createInstallmentPurchaseUseCase(
  input: Input,
  repo: ICreditCardPurchaseRepository,
) {
  const { purchase, installments } = createInstallmentPurchase(input);
  return repo.save(purchase, installments);
}
