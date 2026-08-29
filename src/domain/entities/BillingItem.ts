import { InvalidBillingItemError } from "../errors";

export type InstallmentBillingItem = {
  kind: "installment";
  description: string;
  amount: number;
  date: Date;
  installmentNumber: number;
  totalInstallments: number;
};

export type TransactionBillingItem = {
  kind: "transaction";
  description: string;
  amount: number;
  date: Date;
  transactionType: "EXPENSE" | "INCOME" | "INVESTMENT";
};

export type RefundBillingItem = {
  kind: "refund";
  description: string;
  amount: number;
  date: Date;
};

export type BillingItem = InstallmentBillingItem | TransactionBillingItem | RefundBillingItem;

type CreateInstallmentInput = {
  description: string;
  amount: number;
  date: Date;
  installmentNumber: number;
  totalInstallments: number;
};

type CreateTransactionInput = {
  description: string;
  amount: number;
  date: Date;
  transactionType: "EXPENSE" | "INCOME" | "INVESTMENT";
};

type CreateRefundInput = {
  description: string;
  amount: number;
  date: Date;
};

export function createInstallmentBillingItem(
  input: CreateInstallmentInput,
): InstallmentBillingItem {
  if (input.amount <= 0) {
    throw new InvalidBillingItemError("Amount must be positive");
  }

  if (!input.description || input.description.trim() === "") {
    throw new InvalidBillingItemError("Description cannot be empty");
  }

  if (!input.date) {
    throw new InvalidBillingItemError("Date is required");
  }

  if (input.installmentNumber < 1) {
    throw new InvalidBillingItemError("Installment number must be >= 1");
  }

  if (input.totalInstallments < 1) {
    throw new InvalidBillingItemError("Total installments must be >= 1");
  }

  if (input.installmentNumber > input.totalInstallments) {
    throw new InvalidBillingItemError("Installment number cannot exceed total installments");
  }

  return {
    kind: "installment",
    description: input.description,
    amount: input.amount,
    date: input.date,
    installmentNumber: input.installmentNumber,
    totalInstallments: input.totalInstallments,
  };
}

export function createTransactionBillingItem(
  input: CreateTransactionInput,
): TransactionBillingItem {
  if (input.amount <= 0) {
    throw new InvalidBillingItemError("Amount must be positive");
  }

  if (!input.description || input.description.trim() === "") {
    throw new InvalidBillingItemError("Description cannot be empty");
  }

  if (!input.date) {
    throw new InvalidBillingItemError("Date is required");
  }

  return {
    kind: "transaction",
    description: input.description,
    amount: input.amount,
    date: input.date,
    transactionType: input.transactionType,
  };
}

export function createRefundBillingItem(input: CreateRefundInput): RefundBillingItem {
  if (input.amount <= 0) {
    throw new InvalidBillingItemError("Amount must be positive");
  }

  if (!input.description || input.description.trim() === "") {
    throw new InvalidBillingItemError("Description cannot be empty");
  }

  if (!input.date) {
    throw new InvalidBillingItemError("Date is required");
  }

  return {
    kind: "refund",
    description: input.description,
    amount: input.amount,
    date: input.date,
  };
}

export function isInstallmentBillingItem(item: BillingItem): item is InstallmentBillingItem {
  return item.kind === "installment";
}

export function isRefundBillingItem(item: BillingItem): item is RefundBillingItem {
  return item.kind === "refund";
}
