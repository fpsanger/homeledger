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
