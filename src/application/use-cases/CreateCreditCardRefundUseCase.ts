import {
  type CreditCardRefundRecord,
  type CreditCardRefundSource,
  createCreditCardRefund,
} from "../../domain/entities/CreditCardRefund";
import type { ICreditCardRefundRepository } from "../../domain/repositories/ICreditCardRefundRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import { resolveFirstDueMonth } from "../../domain/services/InstallmentPurchase";
import { resolveClosureForDate } from "../services/resolveCardClosure";

type Input = {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: Date;
  categoryId: string | null;
  source: CreditCardRefundSource;
};

export async function createCreditCardRefundUseCase(
  input: Input,
  refundRepo: ICreditCardRefundRepository,
  creditCardRepo: ICreditCardRepository,
): Promise<CreditCardRefundRecord> {
  const card = await creditCardRepo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");

  const { closureDay, closureInPreviousMonth, effectiveClosureNextMonth } =
    await resolveClosureForDate(card, input.refundDate, creditCardRepo);

  const { year: dueYear, month: dueMonth } = resolveFirstDueMonth({
    purchaseDay: input.refundDate.getUTCDate(),
    purchaseYear: input.refundDate.getUTCFullYear(),
    purchaseMonth: input.refundDate.getUTCMonth() + 1,
    closureDay,
    alwaysNextMonth: card.alwaysNextMonth,
    closureInPreviousMonth,
    closureNextMonth: effectiveClosureNextMonth,
  });

  const refund = createCreditCardRefund({ ...input, dueYear, dueMonth });
  return refundRepo.save(refund);
}
