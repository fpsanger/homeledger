import type { BillingItem } from "../../domain/entities/BillingItem";
import type { ReconciledItem } from "../../domain/entities/ReconciledItem";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";

export async function reconcileStatementUseCase(
  creditCardPurchaseRepo: ICreditCardPurchaseRepository,
  transactionRepo: ITransactionRepository,
  items: BillingItem[],
  personId: string,
  year: number,
  month: number,
  creditCardId?: string,
): Promise<ReconciledItem[]> {
  if (items.length === 0) return [];

  const hasInstallments = items.some((i) => i.kind === "installment");
  const hasTransactions = items.some((i) => i.kind === "transaction");

  const [installmentRecords, transactionRecords] = await Promise.all([
    hasInstallments
      ? creditCardPurchaseRepo.findInstallmentsByMonth(personId, year, month)
      : Promise.resolve([]),
    hasTransactions
      ? transactionRepo.findByPersonAndMonth(personId, year, month)
      : Promise.resolve([]),
  ]);

  const filteredInstallments = creditCardId
    ? installmentRecords.filter((r) => r.creditCardId === creditCardId)
    : installmentRecords;

  return items.map((item): ReconciledItem => {
    if (item.kind === "installment") {
      const match = filteredInstallments.find((existing) => {
        const amountMatch = Math.abs(existing.amount - item.amount) <= 0.01;
        const installmentMatch = existing.installmentNumber === item.installmentNumber;
        return amountMatch && installmentMatch;
      });

      if (match) {
        return { billingItem: item, status: "matched", matchedRecordId: match.id };
      }
      return { billingItem: item, status: "missing" };
    }

    // kind === "transaction"
    const itemDay = item.date.getUTCDate();
    const itemMonth = item.date.getUTCMonth();
    const itemYear = item.date.getUTCFullYear();

    const match = transactionRecords.find((existing) => {
      const typeMatch = existing.type === item.transactionType;
      const amountMatch = Math.abs(existing.amount - item.amount) <= 0.01;
      const d = existing.date;
      const dayMatch =
        d.getUTCFullYear() === itemYear &&
        d.getUTCMonth() === itemMonth &&
        d.getUTCDate() === itemDay;
      return typeMatch && amountMatch && dayMatch;
    });

    if (match) {
      return { billingItem: item, status: "matched", matchedRecordId: match.id };
    }
    return { billingItem: item, status: "missing" };
  });
}
