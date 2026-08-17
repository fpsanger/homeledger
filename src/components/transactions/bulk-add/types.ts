import { parseCurrencyBR } from "@/lib/utils";

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
    description: "",
    status: "pending",
  };
}

function validateInstallmentRow(row: BulkRow): string | null {
  if (!row.creditCardId) return "Selecione o cartão.";
  const n = parseInt(row.numberOfInstallments, 10);
  if (!n || n < 2) return "Informe o número de parcelas.";
  return null;
}

export function validateRow(row: BulkRow): string | null {
  if (!row.personId) return "Selecione a pessoa.";
  const amount = row.amount ? parseCurrencyBR(row.amount) : NaN;
  if (!amount || Number.isNaN(amount) || amount <= 0) return "Informe um valor válido.";
  if (!row.date) return "Informe a data.";
  if (row.type === "installment") return validateInstallmentRow(row);
  return null;
}
