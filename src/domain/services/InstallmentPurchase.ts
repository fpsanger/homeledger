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
};

type CreateInstallmentsInput = {
  personId: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  description: string;
  categoryId: string | null;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createInstallments(input: CreateInstallmentsInput): InstallmentDraft[] {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (input.totalAmount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (input.numberOfInstallments < 1) {
    throw new Error("Number of installments must be at least 1");
  }

  const baseAmount = Math.floor((input.totalAmount / input.numberOfInstallments) * 100) / 100;

  if (baseAmount <= 0) {
    throw new Error("Amount too small for the number of installments");
  }

  const startYear = input.purchaseDate.getUTCFullYear();
  const startMonth = input.purchaseDate.getUTCMonth() + 1;

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const totalMonths = startMonth - 1 + i;
    const dueYear = startYear + Math.floor(totalMonths / 12);
    const dueMonth = (totalMonths % 12) + 1;

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
};

type InstallmentPurchaseResult = {
  purchase: PurchaseDraft;
  installments: InstallmentDraftWithPurchaseId[];
};

export function createInstallmentPurchase(
  input: CreateInstallmentPurchaseInput,
): InstallmentPurchaseResult {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (input.totalAmount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (input.numberOfInstallments <= 1) {
    throw new Error("Number of installments must be greater than 1");
  }

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
  };

  return { purchase, installments };
}

export function cancelInstallmentPurchase(installments: InstallmentDraft[]): InstallmentDraft[] {
  return installments.map(inst => ({
    ...inst,
    isCanceled: true,
  }));
}
