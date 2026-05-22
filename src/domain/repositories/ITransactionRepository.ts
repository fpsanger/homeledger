export type IncomeSource = "SALARY" | "FREELANCE" | "RENTAL" | "INVESTMENT" | "OTHER";

export interface TransactionRecord {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  amount: number;
  date: Date;
  description: string;
  paymentMethod:
    | "CASH"
    | "DEBIT_CARD"
    | "CREDIT_CARD"
    | "PIX"
    | "BANK_TRANSFER"
    | "BOLETO"
    | "ACCOUNT_DEBIT"
    | null;
  source: IncomeSource | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionRecord | null>;
  findByMonth(year: number, month: number): Promise<TransactionRecord[]>;
  findByPersonAndMonth(personId: string, year: number, month: number): Promise<TransactionRecord[]>;
  findByYear(year: number): Promise<TransactionRecord[]>;
  findByPersonAndYear(personId: string, year: number): Promise<TransactionRecord[]>;
  save(transaction: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord>;
  update(
    id: string,
    fields: Partial<Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">>,
  ): Promise<TransactionRecord>;
  delete(id: string): Promise<void>;
}
