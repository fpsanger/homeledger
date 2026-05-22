import type { CreditCardClosureRecord, CreditCardRecord } from "../entities/CreditCard";

export interface ICreditCardRepository {
  save(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  update(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  findById(id: string): Promise<CreditCardRecord | null>;
  findAll(): Promise<CreditCardRecord[]>;
  delete(id: string): Promise<void>;
  hasPurchases(id: string): Promise<boolean>;
  setClosure(closure: Omit<CreditCardClosureRecord, "id">): Promise<CreditCardClosureRecord>;
  findClosure(
    creditCardId: string,
    year: number,
    month: number,
  ): Promise<CreditCardClosureRecord | null>;
  findClosuresByCard(creditCardId: string): Promise<CreditCardClosureRecord[]>;
  deleteClosure(creditCardId: string, year: number, month: number): Promise<void>;
}
