export type PendingTransactionStatus = "PENDING" | "CONFIRMED" | "DISCARDED";

/** A purchase reported by an iOS Shortcut that still waits for the user to review it. */
export interface PendingTransactionRecord {
  id: string;
  personId: string;
  amount: number;
  /** Exact moment of the purchase; identifies it when the Shortcut reports it twice. */
  occurredAt: Date;
  /** Calendar day of the purchase in the user's timezone, stored as UTC midnight. */
  occurredOn: Date;
  merchant: string;
  /** Card name exactly as the Wallet reported it. */
  cardName: string;
  creditCardId: string | null;
  suggestedCategoryId: string | null;
  status: PendingTransactionStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

type CreatePendingTransactionInput = Pick<
  PendingTransactionRecord,
  | "id"
  | "personId"
  | "amount"
  | "occurredAt"
  | "occurredOn"
  | "merchant"
  | "cardName"
  | "creditCardId"
  | "suggestedCategoryId"
>;

export function createPendingTransaction(
  input: CreatePendingTransactionInput,
): PendingTransactionRecord {
  if (!input.personId) throw new Error("Person is required");
  if (!(input.amount > 0)) throw new Error("Amount must be positive");
  const merchant = input.merchant.trim();
  if (!merchant) throw new Error("Merchant is required");

  return {
    ...input,
    merchant,
    cardName: input.cardName.trim(),
    status: "PENDING",
    createdAt: new Date(),
    resolvedAt: null,
  };
}
