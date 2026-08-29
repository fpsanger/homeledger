export type ClosureType = "FIXED" | "VARIABLE";

export interface CreditCardRecord {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
  createdAt: Date;
}

export interface CreditCardClosureRecord {
  id: string;
  creditCardId: string;
  year: number;
  month: number;
  closureDay: number;
  previousMonth: boolean;
}

type CreateCreditCardInput = {
  id: string;
  name: string;
  closureType: ClosureType;
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

function validateClosureFields(closureType: ClosureType, fixedClosureDay: number | null): void {
  if (closureType === "FIXED") {
    if (fixedClosureDay == null) throw new Error("fixedClosureDay is required for FIXED cards");
    if (fixedClosureDay < 1 || fixedClosureDay > 31)
      throw new Error("fixedClosureDay must be between 1 and 31");
  } else {
    if (fixedClosureDay !== null && fixedClosureDay !== undefined)
      throw new Error("fixedClosureDay must be null for VARIABLE cards");
  }
}

export function createCreditCard(input: CreateCreditCardInput): CreditCardRecord {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  if (input.dueDayOfMonth < 1 || input.dueDayOfMonth > 31)
    throw new Error("dueDayOfMonth must be between 1 and 31");

  validateClosureFields(input.closureType, input.fixedClosureDay);

  return {
    id: input.id,
    name,
    closureType: input.closureType,
    fixedClosureDay: input.fixedClosureDay ?? null,
    fixedClosurePreviousMonth: input.fixedClosurePreviousMonth,
    dueDayOfMonth: input.dueDayOfMonth,
    alwaysNextMonth: input.alwaysNextMonth,
    closureNextMonth: input.closureNextMonth,
    createdAt: new Date(),
  };
}
