export type { IncomeSource, PaymentMethod, Transaction } from "../entities/Transaction";

import type { Transaction } from "../entities/Transaction";

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByMonth(year: number, month: number): Promise<Transaction[]>;
  findByPersonAndMonth(personId: string, year: number, month: number): Promise<Transaction[]>;
  findByYear(year: number): Promise<Transaction[]>;
  findByPersonAndYear(personId: string, year: number): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<Transaction>;
  update(
    id: string,
    fields: Partial<Omit<Transaction, "id">>,
  ): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
