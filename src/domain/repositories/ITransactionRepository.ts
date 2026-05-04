export interface TransactionRecord {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionRecord | null>;
  findByMonth(year: number, month: number): Promise<TransactionRecord[]>;
  findByPersonAndMonth(personId: string, year: number, month: number): Promise<TransactionRecord[]>;
  save(transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord>;
  delete(id: string): Promise<void>;
}
