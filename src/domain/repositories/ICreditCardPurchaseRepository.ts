export interface CreditCardPurchaseRecord {
  id: string;
  personId: string | null;
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
  transactionYear: number;
  transactionMonth: number;
  isPaid: boolean;
  categoryId: string | null;
  purchaseDescription?: string;
  purchaseDate?: Date;
  personId: string;
  creditCardId?: string | null;
  numberOfInstallments?: number;
  purchaseTotalAmount?: number;
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
  findAllInstallmentsByPurchaseMonth(year: number, month: number): Promise<InstallmentRecord[]>;
  findInstallmentsByPurchaseMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]>;
  findAllInstallmentsByTransactionMonth(year: number, month: number): Promise<InstallmentRecord[]>;
  findInstallmentsByTransactionMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<InstallmentRecord[]>;
  findAllInstallmentsByYear(year: number): Promise<InstallmentRecord[]>;
  findInstallmentsByYear(personId: string, year: number): Promise<InstallmentRecord[]>;
  findAllInstallmentsByTransactionYear(year: number): Promise<InstallmentRecord[]>;
  findInstallmentsByTransactionYear(personId: string, year: number): Promise<InstallmentRecord[]>;
  updatePurchase(
    id: string,
    data: Pick<
      CreditCardPurchaseRecord,
      "description" | "totalAmount" | "purchaseDate" | "categoryId" | "creditCardId"
    > & { firstDue?: { year: number; month: number } },
  ): Promise<void>;
  deletePurchase(id: string): Promise<void>;
  markInstallmentPaid(installmentId: string): Promise<void>;
  markInstallmentsPaid(ids: string[]): Promise<void>;
  markInstallmentsUnpaid(ids: string[]): Promise<void>;
  deleteInstallment(installmentId: string): Promise<void>;
  findByPurchaseId(purchaseId: string): Promise<InstallmentRecord[]>;
  updateInstallment(id: string, fields: { amount: number; description: string }): Promise<void>;
  findAllPurchasesWithInstallments(
    personId?: string,
  ): Promise<CreditCardPurchaseWithInstallments[]>;
  findPurchasesByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<CreditCardPurchaseRecord[]>;
  findPurchaseById(id: string): Promise<CreditCardPurchaseRecord | null>;
}
