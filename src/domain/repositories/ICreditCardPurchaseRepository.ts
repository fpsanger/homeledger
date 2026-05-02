export interface CreditCardPurchaseRecord {
  id: string;
  personId: string;
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
  findInstallmentsByMonth(personId: string, year: number, month: number): Promise<InstallmentRecord[]>;
  markInstallmentPaid(installmentId: string): Promise<void>;
}
