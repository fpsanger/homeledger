import type { ITransactionRepository, TransactionRecord } from "../../domain/repositories/ITransactionRepository";

const VALID_PAYMENT_METHODS = ["CASH", "DEBIT_CARD", "CREDIT_CARD", "PIX", "BANK_TRANSFER", "BOLETO"] as const;
type PaymentMethod = typeof VALID_PAYMENT_METHODS[number];

type Input = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  categoryId: string | null;
  description: string;
};

export async function updateExpenseUseCase(
  input: Input,
  repo: ITransactionRepository,
): Promise<TransactionRecord> {
  if (!input.personId) throw new Error("Person is required");
  if (input.amount <= 0) throw new Error("Amount must be positive");
  if (!input.date) throw new Error("Date is required");
  if (!(VALID_PAYMENT_METHODS as readonly string[]).includes(input.paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  return repo.update(input.id, {
    personId: input.personId,
    amount: input.amount,
    date: input.date,
    paymentMethod: input.paymentMethod,
    categoryId: input.categoryId,
    description: input.description,
  });
}
