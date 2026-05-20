import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { ICreditCardPurchaseRepository, InstallmentRecord } from "../../domain/repositories/ICreditCardPurchaseRepository";

export type BillInstallmentItem = InstallmentRecord & {
  purchaseDescription: string;
  personId: string;
  categoryId: string | null;
  numberOfInstallments: number;
  purchaseDate: Date;
};

export type CreditCardBillEntry = {
  card: CreditCardRecord;
  dueDayOfMonth: number;
  installments: BillInstallmentItem[];
  total: number;
};

type Input = { year: number; month: number; personId?: string };

export async function getCreditCardBillUseCase(
  input: Input,
  creditCardRepo: ICreditCardRepository,
  purchaseRepo: ICreditCardPurchaseRepository,
): Promise<CreditCardBillEntry[]> {
  const [installments, purchases, cards] = await Promise.all([
    purchaseRepo.findAllInstallmentsByMonth(input.year, input.month),
    purchaseRepo.findAllPurchasesWithInstallments(input.personId),
    creditCardRepo.findAll(),
  ]);

  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  // Group enriched installments by creditCardId (skip canceled)
  const byCard = new Map<string, BillInstallmentItem[]>();
  for (const inst of installments) {
    if (inst.isCanceled) continue;
    const purchase = purchaseMap.get(inst.creditCardPurchaseId);
    if (!purchase?.creditCardId) continue;
    const enriched: BillInstallmentItem = {
      ...inst,
      purchaseDescription: purchase.description,
      personId: purchase.personId,
      categoryId: purchase.categoryId,
      numberOfInstallments: purchase.numberOfInstallments,
      purchaseDate: purchase.purchaseDate,
    };
    const list = byCard.get(purchase.creditCardId) ?? [];
    list.push(enriched);
    byCard.set(purchase.creditCardId, list);
  }

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const result: CreditCardBillEntry[] = [];
  for (const [cardId, insts] of Array.from(byCard.entries())) {
    const card = cardMap.get(cardId);
    if (!card) continue;
    result.push({
      card,
      dueDayOfMonth: card.dueDayOfMonth,
      installments: insts,
      total: insts.reduce((sum, i) => sum + i.amount, 0),
    });
  }

  return result.sort((a, b) => a.card.name.localeCompare(b.card.name));
}
