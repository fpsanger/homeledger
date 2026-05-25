export type LoyaltyTransactionType =
  | "PURCHASE"
  | "EARN"
  | "BONUS"
  | "REDEEM"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "EXPIRE"
  | "ADJUSTMENT";

const TRANSFER_TYPES: LoyaltyTransactionType[] = ["TRANSFER_OUT", "TRANSFER_IN"];

export type LoyaltyTransactionRecord = {
  id: string;
  programId: string;
  personId: string | null;
  transferId: string | null;
  type: LoyaltyTransactionType;
  points: number;
  date: Date;
  description: string | null;
  expiresAt: Date | null;
  costBrl: number | null;
  valueBrl: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateLoyaltyTransactionInput = {
  id: string;
  programId: string;
  personId: string | null;
  transferId: string | null;
  type: LoyaltyTransactionType;
  points: number;
  date: Date;
  description?: string | null;
  expiresAt?: Date | null;
  costBrl?: number | null;
  valueBrl?: number | null;
};

export function createLoyaltyTransaction(input: CreateLoyaltyTransactionInput): LoyaltyTransactionRecord {
  const isTransferType = TRANSFER_TYPES.includes(input.type);

  if (!isTransferType && input.transferId != null) {
    throw new Error("transferId must be null for non-transfer types");
  }

  if (input.type === "TRANSFER_OUT" || input.type === "TRANSFER_IN") {
    if (!input.transferId) throw new Error(`${input.type} requires transferId`);
  }

  if (input.type !== "ADJUSTMENT") {
    if (input.points <= 0) throw new Error("points must be positive");
  }

  if (input.type === "PURCHASE") {
    if (!input.costBrl || input.costBrl <= 0) throw new Error("PURCHASE requires costBrl > 0");
  }

  if (input.type === "REDEEM") {
    if (!input.valueBrl || input.valueBrl <= 0) throw new Error("REDEEM requires valueBrl > 0");
  }

  const now = new Date();
  return {
    id: input.id,
    programId: input.programId,
    personId: input.personId,
    transferId: input.transferId,
    type: input.type,
    points: input.points,
    date: input.date,
    description: input.description ?? null,
    expiresAt: input.expiresAt ?? null,
    costBrl: input.costBrl ?? null,
    valueBrl: input.valueBrl ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
