import type { CreditCardRefundRecord } from "../entities/CreditCardRefund";

export type { CreditCardRefundRecord };

export interface ICreditCardRefundRepository {
  save(refund: Omit<CreditCardRefundRecord, "createdAt">): Promise<CreditCardRefundRecord>;
  findByMonth(year: number, month: number): Promise<CreditCardRefundRecord[]>;
  findByPersonAndMonth(
    personId: string,
    year: number,
    month: number,
  ): Promise<CreditCardRefundRecord[]>;
  findById(id: string): Promise<CreditCardRefundRecord | null>;
  deleteById(id: string): Promise<void>;
}
