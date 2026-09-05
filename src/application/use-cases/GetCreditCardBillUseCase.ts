import type { CreditCardRecord } from "../../domain/entities/CreditCard";
import type { CreditCardRefundRecord } from "../../domain/entities/CreditCardRefund";
import type {
  CreditCardPurchaseWithInstallments,
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

function groupInstallmentsByCard(
  installments: InstallmentRecord[],
  purchaseMap: Map<string, CreditCardPurchaseWithInstallments>,
): Map<string, BillInstallmentItem[]> {
  const installmentsByCard = new Map<string, BillInstallmentItem[]>();
  for (const inst of installments) {
    const purchase = purchaseMap.get(inst.creditCardPurchaseId);
    if (!purchase?.creditCardId) continue;
    const enriched: BillInstallmentItem = {
      ...inst,
      purchaseDescription: purchase.description,
      personId: inst.personId,
      categoryId: purchase.categoryId,
      numberOfInstallments: purchase.numberOfInstallments,
      purchaseDate: purchase.purchaseDate,
    };
    const list = installmentsByCard.get(purchase.creditCardId) ?? [];
    list.push(enriched);
    installmentsByCard.set(purchase.creditCardId, list);
  }
  return installmentsByCard;
}

function groupRefundsByCard(
  refunds: CreditCardRefundRecord[],
  personId: string | undefined,
): Map<string, CreditCardRefundRecord[]> {
  const refundsByCard = new Map<string, CreditCardRefundRecord[]>();
  for (const refund of refunds) {
    if (personId && refund.personId !== personId) continue;
    const list = refundsByCard.get(refund.creditCardId) ?? [];
    list.push(refund);
    refundsByCard.set(refund.creditCardId, list);
  }
  return refundsByCard;
}

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
  const scopedInstallments = input.personId
    ? installments.filter((i) => i.personId === input.personId)
    : installments;
  const installmentsByCard = groupInstallmentsByCard(scopedInstallments, purchaseMap);
  const refundsByCard = groupRefundsByCard(refunds, input.personId);

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
