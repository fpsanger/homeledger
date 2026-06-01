export type LoyaltyProgramType = "AIRLINE" | "HOTEL" | "BANK" | "OTHER";

export type LoyaltyProgramRecord = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateLoyaltyProgramInput = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  color: string;
};

export function createLoyaltyProgram(input: CreateLoyaltyProgramInput): LoyaltyProgramRecord {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!input.color) throw new Error("Color is required");

  const now = new Date();
  return {
    id: input.id,
    name,
    type: input.type,
    color: input.color,
    createdAt: now,
    updatedAt: now,
  };
}
