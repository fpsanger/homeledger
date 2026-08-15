import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { CreditCardRefundRecord } from "../../domain/entities/CreditCardRefund";
import type {
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRefundRepository } from "../../domain/repositories/ICreditCardRefundRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";

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
  refunds: CreditCardRefundRecord[];
  total: number;
};

type Input = { year: number; month: number; personId?: string };

export async function getCreditCardBillUseCase(
  input: Input,
  creditCardRepo: ICreditCardRepository,
  purchaseRepo: ICreditCardPurchaseRepository,
  refundRepo: ICreditCardRefundRepository,
): Promise<CreditCardBillEntry[]> {
  const [installments, purchases, cards, refunds] = await Promise.all([
    purchaseRepo.findAllInstallmentsByMonth(input.year, input.month),
    purchaseRepo.findAllPurchasesWithInstallments(input.personId),
    creditCardRepo.findAll(),
    refundRepo.findByMonth(input.year, input.month),
  ]);

  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  const installmentsByCard = new Map<string, BillInstallmentItem[]>();
  for (const inst of installments) {
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
    const list = installmentsByCard.get(purchase.creditCardId) ?? [];
    list.push(enriched);
    installmentsByCard.set(purchase.creditCardId, list);
  }

  const refundsByCard = new Map<string, CreditCardRefundRecord[]>();
  for (const refund of refunds) {
    if (input.personId && refund.personId !== input.personId) continue;
    const list = refundsByCard.get(refund.creditCardId) ?? [];
    list.push(refund);
    refundsByCard.set(refund.creditCardId, list);
  }

  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const cardIds = new Set([
    ...Array.from(installmentsByCard.keys()),
    ...Array.from(refundsByCard.keys()),
  ]);

  const result: CreditCardBillEntry[] = [];
  for (const cardId of Array.from(cardIds)) {
    const card = cardMap.get(cardId);
    if (!card) continue;
    const insts = installmentsByCard.get(cardId) ?? [];
    const cardRefunds = refundsByCard.get(cardId) ?? [];
    result.push({
      card,
      dueDayOfMonth: card.dueDayOfMonth,
      installments: insts.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime()),
      refunds: cardRefunds,
      total:
        insts.reduce((sum, i) => sum + i.amount, 0) -
        cardRefunds.reduce((sum, r) => sum + r.amount, 0),
    });
  }

  return result.sort((a, b) => a.card.name.localeCompare(b.card.name));
}
