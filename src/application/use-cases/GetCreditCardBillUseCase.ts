import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { ICreditCardPurchaseRepository, InstallmentRecord } from "../../domain/repositories/ICreditCardPurchaseRepository";

export type CreditCardBillEntry = {
  card: CreditCardRecord;
  dueDayOfMonth: number;
  installments: InstallmentRecord[];
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

  // Map purchaseId → creditCardId
  const purchaseCardMap = new Map<string, string>(
    purchases
      .filter((p) => p.creditCardId != null)
      .map((p) => [p.id, p.creditCardId as string]),
  );

  // Group installments by creditCardId (skip canceled)
  const byCard = new Map<string, InstallmentRecord[]>();
  for (const inst of installments) {
    if (inst.isCanceled) continue;
    const cardId = purchaseCardMap.get(inst.creditCardPurchaseId);
    if (!cardId) continue;
    const list = byCard.get(cardId) ?? [];
    list.push(inst);
    byCard.set(cardId, list);
  }

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const result: CreditCardBillEntry[] = [];
  for (const [cardId, insts] of byCard.entries()) {
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
