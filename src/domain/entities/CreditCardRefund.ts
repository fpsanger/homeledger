export type CreditCardRefundSource = "MANUAL" | "IMPORT";

export interface CreditCardRefundRecord {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: Date;
  dueYear: number;
  dueMonth: number;
  categoryId: string | null;
  source: CreditCardRefundSource;
  createdAt: Date;
}

type CreateCreditCardRefundInput = {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: Date;
  dueYear: number;
  dueMonth: number;
  categoryId: string | null;
  source: CreditCardRefundSource;
};

export function createCreditCardRefund(input: CreateCreditCardRefundInput): CreditCardRefundRecord {
  if (!input.creditCardId) throw new Error("Credit card is required");
  if (!input.personId) throw new Error("Person is required");

  const description = input.description.trim();
  if (!description) throw new Error("Description is required");

  if (input.amount <= 0) throw new Error("Amount must be positive");

  if (!input.refundDate) throw new Error("Refund date is required");

  return {
    id: input.id,
    creditCardId: input.creditCardId,
    personId: input.personId,
    description,
    amount: input.amount,
    refundDate: input.refundDate,
    dueYear: input.dueYear,
    dueMonth: input.dueMonth,
    categoryId: input.categoryId,
    source: input.source,
    createdAt: new Date(),
  };
}
