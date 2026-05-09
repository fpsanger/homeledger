export type ClosureType = "FIXED" | "VARIABLE";

export interface CreditCardRecord {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  createdAt: Date;
}

export interface CreditCardClosureRecord {
  id: string;
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
}

type CreateCreditCardInput = {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

export function createCreditCard(input: CreateCreditCardInput): CreditCardRecord {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  if (input.dueDayOfMonth < 1 || input.dueDayOfMonth > 31)
    throw new Error("dueDayOfMonth must be between 1 and 31");

  if (input.closureType === "FIXED") {
    if (input.fixedClosureDay == null)
      throw new Error("fixedClosureDay is required for FIXED cards");
    if (input.fixedClosureDay < 1 || input.fixedClosureDay > 31)
      throw new Error("fixedClosureDay must be between 1 and 31");
  } else {
    if (input.fixedClosureDay !== null && input.fixedClosureDay !== undefined)
      throw new Error("fixedClosureDay must be null for VARIABLE cards");
  }

  return {
    id: input.id,
    name,
    closureType: input.closureType,
    fixedClosureDay: input.fixedClosureDay ?? null,
    dueDayOfMonth: input.dueDayOfMonth,
    alwaysNextMonth: input.alwaysNextMonth,
    createdAt: new Date(),
  };
}
