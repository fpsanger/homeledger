import type { BillingItem } from "../../domain/entities/BillingItem";
import {
  createInstallmentBillingItem,
  createRefundBillingItem,
  createTransactionBillingItem,
} from "../../domain/entities/BillingItem";

export type BillingRowInstallment = {
  description: string;
  installmentNumber: number;
  totalInstallments: number;
};

export type BillingRowClassification = {
  description: string;
  absAmount: number;
  date: Date;
  isCredit: boolean;
  installment: BillingRowInstallment | null;
};

export function classifyBillingRow(row: BillingRowClassification): BillingItem | null {
  try {
    if (row.installment) {
      return createInstallmentBillingItem({
        description: row.installment.description,
        amount: row.absAmount,
        date: row.date,
        installmentNumber: row.installment.installmentNumber,
        totalInstallments: row.installment.totalInstallments,
      });
    }
    if (row.isCredit) {
      return createRefundBillingItem({
        description: row.description,
        amount: row.absAmount,
        date: row.date,
      });
    }
    return createTransactionBillingItem({
      description: row.description,
      amount: row.absAmount,
      date: row.date,
      transactionType: "EXPENSE",
    });
  } catch {
    return null;
  }
}
