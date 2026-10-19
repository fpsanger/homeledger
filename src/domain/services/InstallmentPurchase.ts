export type InstallmentDraft = {
  personId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  transactionYear: number;
  transactionMonth: number;
  isPaid: boolean;
  categoryId: string | null;
};

export type PurchaseSplitInput = {
  personId: string;
  amount: number;
};

export type InstallmentDraftWithPurchaseId = InstallmentDraft & {
  creditCardPurchaseId: string;
};

export type PurchaseDraft = {
  id: string;
  personId: string | null;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
  creditCardId: string;
};

export type BillingMonth = {
  year: number;
  month: number;
};

export function validateBillingMonth(billingMonth: BillingMonth): void {
  if (!Number.isInteger(billingMonth.year)) throw new Error("Billing year must be an integer");
  if (!Number.isInteger(billingMonth.month) || billingMonth.month < 1 || billingMonth.month > 12)
    throw new Error("Billing month must be between 1 and 12");
}

type ResolveFirstDueMonthInput = {
  purchaseDay: number;
  purchaseYear: number;
  purchaseMonth: number;
  closureDay: number;
  closureInPreviousMonth?: boolean;
  closureNextMonth?: boolean;
};

export function resolveFirstDueMonth(input: ResolveFirstDueMonthInput): BillingMonth {
  const shiftNext =
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
  firstDue: BillingMonth;
};

export function createInstallments(input: CreateInstallmentsInput): InstallmentDraft[] {
  if (!input.personId) throw new Error("Person is required");
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments < 1) throw new Error("Number of installments must be at least 1");

  const baseAmount = Math.floor((input.totalAmount / input.numberOfInstallments) * 100) / 100;
  if (baseAmount <= 0) throw new Error("Amount too small for the number of installments");

  validateBillingMonth(input.firstDue);

  const purchaseYear = input.purchaseDate.getUTCFullYear();
  const purchaseMonth = input.purchaseDate.getUTCMonth() + 1;
  const first = input.firstDue;

  // Convert first due to absolute month index for arithmetic
  const firstAbsolute = (first.year - 1) * 12 + (first.month - 1);
  // Transaction month starts at purchase month, advances sequentially, independent of card rules
  const purchaseAbsolute = (purchaseYear - 1) * 12 + (purchaseMonth - 1);

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12) + 1;
    const dueMonth = (absolute % 12) + 1;

    const txAbsolute = purchaseAbsolute + i;
    const transactionYear = Math.floor(txAbsolute / 12) + 1;
    const transactionMonth = (txAbsolute % 12) + 1;

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
      transactionYear,
      transactionMonth,
      isPaid: false,
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
  firstDue: BillingMonth;
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

type CreateSplitInstallmentPurchaseInput = Omit<CreateInstallmentPurchaseInput, "personId"> & {
  splits: PurchaseSplitInput[];
};

function validateSplits(splits: PurchaseSplitInput[], totalAmount: number): void {
  if (splits.length < 2) throw new Error("A split purchase requires at least 2 people");

  const personIds = new Set<string>();
  for (const split of splits) {
    if (!split.personId) throw new Error("Person is required");
    if (personIds.has(split.personId))
      throw new Error("Each person can only appear once in a split");
    personIds.add(split.personId);
    if (split.amount <= 0) throw new Error("Amount must be positive");
  }

  const totalCents = Math.round(totalAmount * 100);
  const splitCents = splits.reduce((sum, split) => sum + Math.round(split.amount * 100), 0);
  if (splitCents !== totalCents) {
    throw new Error("Split amounts must sum to the total amount");
  }
}

export function createSplitInstallmentPurchase(
  input: CreateSplitInstallmentPurchaseInput,
): InstallmentPurchaseResult {
  if (input.totalAmount <= 0) throw new Error("Amount must be positive");
  if (input.numberOfInstallments < 1) throw new Error("Number of installments must be at least 1");
  validateSplits(input.splits, input.totalAmount);

  const installments: InstallmentDraftWithPurchaseId[] = input.splits.flatMap((split) =>
    createInstallments({ ...input, personId: split.personId, totalAmount: split.amount }).map(
      (draft) => ({ ...draft, creditCardPurchaseId: input.id }),
    ),
  );

  const purchase: PurchaseDraft = {
    id: input.id,
    personId: null,
    totalAmount: input.totalAmount,
    numberOfInstallments: input.numberOfInstallments,
    purchaseDate: input.purchaseDate,
    description: input.description,
    categoryId: input.categoryId,
    creditCardId: input.creditCardId,
  };

  return { purchase, installments };
}
