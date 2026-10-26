import {
  type AmountLink,
  linkFromInstallment,
  linkFromTotal,
  linkWithCount,
} from "../../transactions/unifiedTransactionForm/billing";
import { hasInvalidAmount } from "./amountValidation";

export type RowStatus = "pending" | "loading" | "success" | "error";

export type ClosureType = "FIXED" | "VARIABLE";

export type PurchaseRow = {
  rowId: string;
  /** The purchase total: what is submitted. The installment amount is derived from it. */
  amount: string;
  installmentAmount: string;
  /** Which of the two amounts the user typed last; it stays put when the count changes. */
  lastEdited: AmountLink["lastEdited"];
  date: string;
  categoryId: string;
  description: string;
  numberOfInstallments: string;
  /** "YYYY-MM" override; undefined/empty means the row uses its section's billing month. */
  billingMonth?: string;
  status: RowStatus;
  error?: string;
  isDuplicate?: boolean;
};

export function createEmptyRow(defaultDate: string): PurchaseRow {
  return {
    rowId: crypto.randomUUID(),
    amount: "",
    installmentAmount: "",
    lastEdited: "total",
    date: defaultDate,
    categoryId: "",
    description: "",
    numberOfInstallments: "1",
    status: "pending",
  };
}

export function duplicateRow(row: PurchaseRow, defaultDate: string): PurchaseRow {
  return {
    ...createEmptyRow(defaultDate),
    categoryId: row.categoryId,
    description: row.description,
    numberOfInstallments: row.numberOfInstallments,
    ...(row.billingMonth !== undefined ? { billingMonth: row.billingMonth } : {}),
  };
}

/** An untouched starter row: nothing that makes it a purchase has been entered. */
export function isBlankPurchaseRow(row: PurchaseRow): boolean {
  return !row.amount && !row.installmentAmount && !row.description && !row.categoryId;
}

function linkOf(row: PurchaseRow): AmountLink {
  return {
    amount: row.amount,
    installmentAmount: row.installmentAmount,
    numberOfInstallments: row.numberOfInstallments,
    lastEdited: row.lastEdited,
  };
}

/** The total and the per-installment amount are two views of one figure; a patch moves both. */
export function totalPatch(row: PurchaseRow, value: string): AmountLink {
  return linkFromTotal(value, row.numberOfInstallments);
}

export function installmentPatch(row: PurchaseRow, value: string): AmountLink {
  return linkFromInstallment(value, row.numberOfInstallments);
}

export function countPatch(row: PurchaseRow, value: string): AmountLink {
  return linkWithCount(linkOf(row), value);
}

export function resolveRowBillingMonth(row: PurchaseRow, sectionBillingMonth: string): string {
  return row.billingMonth || sectionBillingMonth;
}

const BILLING_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The fatura is always picked by the user, for every card. */
export function validateBillingMonth(billingMonth: string): string | null {
  if (!billingMonth) return "Informe a fatura (mês).";
  if (!BILLING_MONTH_PATTERN.test(billingMonth)) return "Fatura inválida.";
  return null;
}

export function validateRow(row: PurchaseRow): string | null {
  if (hasInvalidAmount(row.amount)) return "Informe um valor válido.";
  if (!row.date) return "Informe a data.";
  const n = parseInt(row.numberOfInstallments, 10);
  if (!n || n < 1) return "Informe o número de parcelas.";
  return null;
}

export function validatePersonId(personId: string): string | null {
  if (!personId) return "Selecione a pessoa.";
  return null;
}
