import type { CreditCardRecord } from "../entities/CreditCard";

export interface ICreditCardRepository {
  save(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  update(card: Omit<CreditCardRecord, "createdAt">): Promise<CreditCardRecord>;
  findById(id: string): Promise<CreditCardRecord | null>;
  findAll(): Promise<CreditCardRecord[]>;
  delete(id: string): Promise<void>;
  hasPurchases(id: string): Promise<boolean>;
}
