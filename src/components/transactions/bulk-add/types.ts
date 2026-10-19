import { parseCurrencyBR } from "@/lib/utils";
import { type ClosureType, validateBillingMonth } from "../../credit-cards/bulk-add/types";

export type BulkRowType = "expense" | "income" | "installment";
export type BulkRowStatus = "pending" | "loading" | "success" | "error";

export type BulkRow = {
  clientId: string;
  type: BulkRowType;
  personId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  source: string;
  categoryId: string;
  creditCardId: string;
  numberOfInstallments: string;
  /** "YYYY-MM" bill for installment rows; empty lets a FIXED card compute it. */
  billingMonth: string;
  description: string;
  status: BulkRowStatus;
  error?: string;
  isDuplicate?: boolean;
};

export function createEmptyRow(defaultPersonId: string, defaultDate: string): BulkRow {
  return {
    clientId: crypto.randomUUID(),
    type: "expense",
    personId: defaultPersonId,
    amount: "",
    date: defaultDate,
    paymentMethod: "CASH",
    source: "SALARY",
    categoryId: "",
    creditCardId: "",
    numberOfInstallments: "2",
    billingMonth: "",
    description: "",
    status: "pending",
  };
}

function validateInstallmentRow(row: BulkRow, closureType: ClosureType): string | null {
  if (!row.creditCardId) return "Selecione o cartão.";
  const n = parseInt(row.numberOfInstallments, 10);
  if (!n || n < 2) return "Informe o número de parcelas.";
  return validateBillingMonth(row.billingMonth, closureType);
}

function hasInvalidAmount(value: string): boolean {
  if (!value) return true;
  const amount = parseCurrencyBR(value);
  return !Number.isFinite(amount) || amount <= 0;
}

export function validateRow(row: BulkRow, closureType: ClosureType = "FIXED"): string | null {
  if (!row.personId) return "Selecione a pessoa.";
  if (hasInvalidAmount(row.amount)) return "Informe um valor válido.";
  if (!row.date) return "Informe a data.";
  if (row.type === "installment") return validateInstallmentRow(row, closureType);
  return null;
}
