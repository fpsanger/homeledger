import { parseCurrencyBR } from "@/lib/utils";

export type RowStatus = "pending" | "loading" | "success" | "error";

export type PurchaseRow = {
  rowId: string;
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  numberOfInstallments: string;
  status: RowStatus;
  error?: string;
  isDuplicate?: boolean;
};

export function createEmptyRow(defaultDate: string): PurchaseRow {
  return {
    rowId: crypto.randomUUID(),
    amount: "",
    date: defaultDate,
    categoryId: "",
    description: "",
    numberOfInstallments: "2",
    status: "pending",
  };
}

export function duplicateRow(row: PurchaseRow, defaultDate: string): PurchaseRow {
  return {
    ...createEmptyRow(defaultDate),
    categoryId: row.categoryId,
    description: row.description,
    numberOfInstallments: row.numberOfInstallments,
  };
}

function hasInvalidAmount(value: string): boolean {
  if (!value) return true;
  const amount = parseCurrencyBR(value);
  return !Number.isFinite(amount) || amount <= 0;
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
