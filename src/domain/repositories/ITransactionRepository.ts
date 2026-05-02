export interface TransactionRecord {
  id: string;
  workspaceId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionRecord | null>;
  findByWorkspaceAndMonth(workspaceId: string, year: number, month: number): Promise<TransactionRecord[]>;
  save(transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord>;
  delete(id: string): Promise<void>;
}
