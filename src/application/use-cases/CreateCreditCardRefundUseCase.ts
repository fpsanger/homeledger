import {
  type CreditCardRefundRecord,
  type CreditCardRefundSource,
  createCreditCardRefund,
} from "../../domain/entities/CreditCardRefund";
import type { ICreditCardRefundRepository } from "../../domain/repositories/ICreditCardRefundRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { BillingMonth } from "../../domain/services/InstallmentPurchase";
import { resolveBillingMonth } from "../services/resolveBillingMonth";

type Input = {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: Date;
  categoryId: string | null;
  source: CreditCardRefundSource;
  billingMonth?: BillingMonth;
};

export async function createCreditCardRefundUseCase(
  input: Input,
  refundRepo: ICreditCardRefundRepository,
  creditCardRepo: ICreditCardRepository,
): Promise<CreditCardRefundRecord> {
  const card = await creditCardRepo.findById(input.creditCardId);
  if (!card) throw new Error("Credit card not found");

  const { year: dueYear, month: dueMonth } = resolveBillingMonth(
    card,
    input.refundDate,
    input.billingMonth,
  );

  const refund = createCreditCardRefund({ ...input, dueYear, dueMonth });
  return refundRepo.save(refund);
}
