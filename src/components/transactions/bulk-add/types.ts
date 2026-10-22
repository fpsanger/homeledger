import { hasInvalidAmount } from "../../credit-cards/bulk-add/amountValidation";

export type BulkRowType = "expense" | "income";
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
    description: "",
    status: "pending",
  };
}

/** An untouched starter row: nothing that makes it an entry has been typed or picked. */
export function isBlankRow(row: BulkRow): boolean {
  return !row.amount && !row.description && !row.categoryId;
}

export function validateRow(row: BulkRow): string | null {
  if (!row.personId) return "Selecione a pessoa.";
  if (hasInvalidAmount(row.amount)) return "Informe um valor válido.";
  if (!row.date) return "Informe a data.";
  return null;
}
