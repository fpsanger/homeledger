export interface RecurringTransactionRecord {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod:
    | "CASH"
    | "DEBIT_CARD"
    | "CREDIT_CARD"
    | "PIX"
    | "BANK_TRANSFER"
    | "BOLETO"
    | "ACCOUNT_DEBIT";
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UpdateableFields = Partial<
  Pick<
    RecurringTransactionRecord,
    "endDate" | "amount" | "description" | "categoryId" | "paymentMethod" | "frequency"
  >
>;

export interface IRecurringTransactionRepository {
  findById(id: string): Promise<RecurringTransactionRecord | null>;
  findActiveByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<RecurringTransactionRecord[]>;
  findAllActiveByMonth(year: number, month: number): Promise<RecurringTransactionRecord[]>;
  save(
    record: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord>;
  update(id: string, changes: UpdateableFields): Promise<RecurringTransactionRecord>;
  delete(id: string): Promise<void>;
}
