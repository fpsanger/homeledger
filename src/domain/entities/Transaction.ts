export type IncomeSource = "SALARY" | "FREELANCE" | "RENTAL" | "INVESTMENT" | "OTHER";

export type PaymentMethod =
  | "CASH"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "PIX"
  | "BANK_TRANSFER"
  | "BOLETO"
  | "ACCOUNT_DEBIT";

export interface Transaction {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  amount: number;
  date: Date;
  description: string;
  paymentMethod: PaymentMethod | null;
  source: IncomeSource | null;
  categoryId: string | null;
  isRecurring?: boolean;
}

type CreateInvestmentInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  categoryId: string;
};

type CreateExpenseInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: PaymentMethod;
  categoryId: string | null;
};

type CreateIncomeInput = {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  description: string;
  source: IncomeSource;
  categoryId: string | null;
};

export function createInvestment(input: CreateInvestmentInput): Transaction {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (!input.date) {
    throw new Error("Date is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (!input.categoryId) {
    throw new Error("Category is required");
  }

  return {
    id: input.id,
    personId: input.personId,
    type: "INVESTMENT",
    amount: input.amount,
    date: input.date,
    description: input.description,
    paymentMethod: null,
    source: null,
    categoryId: input.categoryId,
  };
}

export function createExpense(input: CreateExpenseInput): Transaction {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (!input.date) {
    throw new Error("Date is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return {
    id: input.id,
    personId: input.personId,
    type: "EXPENSE",
    amount: input.amount,
    date: input.date,
    description: input.description,
    paymentMethod: input.paymentMethod,
    source: null,
    categoryId: input.categoryId,
  };
}

export function createIncome(input: CreateIncomeInput): Transaction {
  if (!input.personId) {
    throw new Error("Person is required");
  }

  if (!input.date) {
    throw new Error("Date is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (!input.source) {
    throw new Error("Source is required");
  }

  return {
    id: input.id,
    personId: input.personId,
    type: "INCOME",
    amount: input.amount,
    date: input.date,
    description: input.description,
    paymentMethod: null,
    source: input.source,
    categoryId: input.categoryId,
  };
}
