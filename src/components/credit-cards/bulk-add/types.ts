import { parseCurrencyBR } from "@/lib/utils";

export type RowStatus = "pending" | "loading" | "success" | "error";

export type ClosureType = "FIXED" | "VARIABLE";

export type PurchaseRow = {
  rowId: string;
  amount: string;
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
    ...(row.billingMonth !== undefined ? { billingMonth: row.billingMonth } : {}),
  };
}

export function resolveRowBillingMonth(row: PurchaseRow, sectionBillingMonth: string): string {
  return row.billingMonth || sectionBillingMonth;
}

/** VARIABLE cards start on the current month's bill; FIXED cards compute it per purchase date. */
export function defaultSectionBillingMonth(closureType: ClosureType, today: string): string {
  return closureType === "VARIABLE" ? today.slice(0, 7) : "";
}

const BILLING_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateBillingMonth(
  billingMonth: string,
  closureType: ClosureType,
): string | null {
  if (!billingMonth) return closureType === "VARIABLE" ? "Informe a fatura (mês)." : null;
  if (!BILLING_MONTH_PATTERN.test(billingMonth)) return "Fatura inválida.";
  return null;
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
