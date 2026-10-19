export type Person = { id: string; name: string };
export type Category = { id: string; name: string; parentId: string | null };
export type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  closureNextMonth: boolean;
};

export type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
  categoryId?: string | null;
  source?: string | null;
};

export type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  creditCardPurchaseId?: string;
  personId?: string;
  categoryId?: string | null;
  purchaseDescription?: string;
  purchaseDate?: Date | string;
  numberOfInstallments?: number;
  creditCardId?: string | null;
  purchaseTotalAmount?: number;
};
