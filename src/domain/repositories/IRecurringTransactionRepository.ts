export interface RecurringTransactionRecord {
  id: string;
  workspaceId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO";
  categoryId: string | null;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringTransactionRepository {
  findActiveByWorkspaceAndMonth(workspaceId: string, year: number, month: number): Promise<RecurringTransactionRecord[]>;
  save(record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">): Promise<RecurringTransactionRecord>;
  delete(id: string): Promise<void>;
}
