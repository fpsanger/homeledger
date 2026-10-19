export type BillSortKey = "description" | "amount" | "date";
export type BillSortDir = "asc" | "desc";

export type BillInstallmentItem = {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  purchaseDescription: string;
  personId: string;
  categoryId: string | null;
  numberOfInstallments: number;
  purchaseDate: string;
};

export type Person = { id: string; name: string };
export type Category = { id: string; name: string; parentId: string | null };
export type CreditCardFull = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  closureNextMonth: boolean;
};

export type PurchaseRecord = {
  id: string;
  personId: string;
  creditCardId: string | null;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: string;
  categoryId: string | null;
};

export type RefundItem = {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: string;
  categoryId: string | null;
};

export type BillEntry = {
  card: { id: string; name: string };
  dueDayOfMonth: number;
  installments: BillInstallmentItem[];
  refunds: RefundItem[];
  total: number;
};
