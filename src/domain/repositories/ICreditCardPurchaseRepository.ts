export interface CreditCardPurchaseRecord {
  id: string;
  workspaceId: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: Date;
  categoryId: string | null;
  createdAt: Date;
}

export interface InstallmentRecord {
  id: string;
  creditCardPurchaseId: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
}

export interface ICreditCardPurchaseRepository {
  save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[]
  ): Promise<CreditCardPurchaseRecord>;
  findInstallmentsByMonth(workspaceId: string, year: number, month: number): Promise<InstallmentRecord[]>;
  markInstallmentPaid(installmentId: string): Promise<void>;
}
