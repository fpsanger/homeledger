export type LoyaltyProgramType = "AIRLINE" | "HOTEL" | "BANK" | "OTHER";

export type LoyaltyProgramRecord = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  color: string;
  /** Market reference for the price of 1k points, in BRL. A single bound acts as a fixed reference. */
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LoyaltyProgramReference = {
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
};

type CreateLoyaltyProgramInput = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  color: string;
  referenceMinPer1kBrl?: number | null;
  referenceMaxPer1kBrl?: number | null;
};

export function validateLoyaltyProgramReference(reference: LoyaltyProgramReference): void {
  const { referenceMinPer1kBrl: min, referenceMaxPer1kBrl: max } = reference;
  if (min !== null && !(min > 0)) throw new Error("referenceMinPer1kBrl must be positive");
  if (max !== null && !(max > 0)) throw new Error("referenceMaxPer1kBrl must be positive");
  if (min !== null && max !== null && min > max) {
    throw new Error("referenceMinPer1kBrl must not exceed referenceMaxPer1kBrl");
  }
}

export function createLoyaltyProgram(input: CreateLoyaltyProgramInput): LoyaltyProgramRecord {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!input.color) throw new Error("Color is required");

  const reference: LoyaltyProgramReference = {
    referenceMinPer1kBrl: input.referenceMinPer1kBrl ?? null,
    referenceMaxPer1kBrl: input.referenceMaxPer1kBrl ?? null,
  };
  validateLoyaltyProgramReference(reference);

  const now = new Date();
  return {
    id: input.id,
    name,
    type: input.type,
    color: input.color,
    ...reference,
    createdAt: now,
    updatedAt: now,
  };
}
