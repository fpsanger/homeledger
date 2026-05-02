export type InstallmentDraft = {
  personId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
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

  const installmentAmount = input.totalAmount / input.numberOfInstallments;
  const startYear = input.purchaseDate.getUTCFullYear();
  const startMonth = input.purchaseDate.getUTCMonth() + 1;

  return Array.from({ length: input.numberOfInstallments }, (_, i) => {
    const totalMonths = startMonth - 1 + i;
    const dueYear = startYear + Math.floor(totalMonths / 12);
    const dueMonth = (totalMonths % 12) + 1;

    return {
      personId: input.personId,
      installmentNumber: i + 1,
      amount: installmentAmount,
      dueYear,
      dueMonth,
      isPaid: false,
      categoryId: input.categoryId,
    };
  });
}
