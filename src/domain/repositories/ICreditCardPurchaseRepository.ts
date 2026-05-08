export interface CreditCardPurchaseRecord {
  id: string;
  personId: string;
  creditCardId: string | null;
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
  isCanceled: boolean;
}

export interface CreditCardPurchaseWithInstallments extends CreditCardPurchaseRecord {
  installments: InstallmentRecord[];
}

export interface ICreditCardPurchaseRepository {
  save(
    purchase: Omit<CreditCardPurchaseRecord, "createdAt">,
    installments: Omit<InstallmentRecord, "id">[],
  ): Promise<CreditCardPurchaseRecord>;
  findAllInstallmentsByMonth(year: number, month: number): Promise<InstallmentRecord[]>;
  findInstallmentsByMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]>;
  updatePurchase(id: string, data: Pick<CreditCardPurchaseRecord, "description" | "totalAmount" | "purchaseDate" | "categoryId" | "creditCardId">): Promise<void>;
  deletePurchase(id: string): Promise<void>;
  markInstallmentPaid(installmentId: string): Promise<void>;
  deleteInstallment(installmentId: string): Promise<void>;
  findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]>;
  updateInstallments(installments: InstallmentRecord[]): Promise<void>;
  findAllPurchasesWithInstallments(personId?: string): Promise<CreditCardPurchaseWithInstallments[]>;
}
