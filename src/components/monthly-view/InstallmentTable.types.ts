export type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  purchaseDescription?: string;
  personId?: string;
  creditCardId?: string | null;
  numberOfInstallments?: number;
  purchaseDate?: string | Date;
};

export type SortKey = "description" | "date" | "amount";
export type SortDir = "asc" | "desc";

export type InstallmentFilters = {
  statusFilter: string;
  dateFrom: string;
  amountMin: string;
};

export function toDateMs(date: string | Date | undefined): number {
  if (!date) return 0;
  return new Date(date).getTime();
}
