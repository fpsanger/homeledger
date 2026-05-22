import type { InstallmentRecord } from "../repositories/ICreditCardPurchaseRepository";

export type InstallmentDraft = {
  personId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
  categoryId: string | null;
};

export type InstallmentDraftWithPurchaseId = InstallmentDraft & {
  creditCardPurchaseId: string;
};

export type PurchaseDraft = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
};

type ResolveFirstDueMonthInput = {
  purchaseDay: number;
  purchaseYear: number;
  purchaseMonth: number;
  closureDay: number;
  alwaysNextMonth: boolean;
  closureInPreviousMonth?: boolean;
  closureNextMonth?: boolean;
};

export function resolveFirstDueMonth(input: ResolveFirstDueMonthInput): {
  year: number;
  month: number;
} {
  const shiftNext =
    input.alwaysNextMonth ||
    input.closureInPreviousMonth ||
    (!input.closureNextMonth && input.purchaseDay >= input.closureDay);
  if (!shiftNext) return { year: input.purchaseYear, month: input.purchaseMonth };

  // When closure is in the previous month and the purchase is on/after the closure day,
  // the purchase misses the next billing month → must shift by 2.
  const shiftBy = input.closureInPreviousMonth && input.purchaseDay >= input.closureDay ? 2 : 1;
  const targetMonth = input.purchaseMonth + shiftBy;
  if (targetMonth > 12) return { year: input.purchaseYear + 1, month: targetMonth - 12 };
  return { year: input.purchaseYear, month: targetMonth };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

type CreateInstallmentsInput = {
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
  closureDay: number;
  alwaysNextMonth: boolean;
  closureInPreviousMonth?: boolean;
  closureNextMonth?: boolean;
};

export function createInstallments(input: CreateInstallmentsInput): InstallmentDraft[] {
  if (!input.personId) throw new Error("Person is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments < 1) throw new Error("Number of installments must be at least 1");

  const baseAmount = Math.floor((input.totalAmount / input.numberOfInstallments) * 100) / 100;
  if (baseAmount <= 0) throw new Error("Amount too small for the number of installments");

  const purchaseDay = input.purchaseDate.getUTCDate();
  const purchaseYear = input.purchaseDate.getUTCFullYear();
  const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;

  const first = resolveFirstDueMonth({
    purchaseDay,
    purchaseYear,
    purchaseMonth,
    closureDay: input.closureDay,
    alwaysNextMonth: input.alwaysNextMonth,
    closureInPreviousMonth: input.closureInPreviousMonth,
    closureNextMonth: input.closureNextMonth,
  });

  // Convert first due to absolute month index for arithmetic
  const firstAbsolute = (first.year - 1) * 12 + (first.month - 1);

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12) + 1;
    const dueMonth = (absolute % 12) + 1;

    const isLast = i === input.numberOfInstallments - 1;
    const amount = isLast
      ? roundCents(input.totalAmount - baseAmount * (input.numberOfInstallments - 1))
      : baseAmount;

    return {
      personId: input.personId,
      installmentNumber: i + 1,
      amount,
      dueYear,
      dueMonth,
      isPaid: false,
      isCanceled: false,
      categoryId: input.categoryId,
    };
  });
}

type CreateInstallmentPurchaseInput = {
  id: string;
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
  closureDay: number;
  alwaysNextMonth: boolean;
  closureInPreviousMonth?: boolean;
  closureNextMonth?: boolean;
};

type InstallmentPurchaseResult = {
  purchase: PurchaseDraft;
  installments: InstallmentDraftWithPurchaseId[];
};

export function createInstallmentPurchase(
  input: CreateInstallmentPurchaseInput,
): InstallmentPurchaseResult {
  if (!input.personId) throw new Error("Person is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments < 1) throw new Error("Number of installments must be at least 1");

  const drafts = createInstallments(input);

  const installments: InstallmentDraftWithPurchaseId[] = drafts.map((draft) => ({
    ...draft,
    creditCardPurchaseId: input.id,
  }));

  const purchase: PurchaseDraft = {
    id: input.id,
    personId: input.personId,
    totalAmount: input.totalAmount,
    numberOfInstallments: input.numberOfInstallments,
    purchaseDate: input.purchaseDate,
    description: input.description,
    categoryId: input.categoryId,
    creditCardId: input.creditCardId,
  };

  return { purchase, installments };
}

export function cancelInstallmentPurchase(
  installments: InstallmentRecord[],
): (InstallmentRecord & { isCanceled: true })[] {
  return installments.map((inst) => ({ ...inst, isCanceled: true as const }));
}
