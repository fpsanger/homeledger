import { formatDatePtBR } from "@/lib/format-date";

export type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
  categoryId?: string | null;
  isRecurring?: boolean;
};

export type Person = { id: string; name: string };
export type Category = { id: string; name: string; parentId: string | null };

export type SortKey = "date" | "amount";
export type SortDir = "asc" | "desc";

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  BOLETO: "Boleto",
  ACCOUNT_DEBIT: "Déb. Conta",
};

export function fmtDate(date: Date | string) {
  const iso = typeof date === "string" ? date : date.toISOString();
  return formatDatePtBR(iso);
}

export function toMs(date: Date | string) {
  return new Date(date).getTime();
}

export function matchesCategoryFilter(
  t: Transaction,
  categories: Category[],
  categoryFilter: string,
): boolean {
  if (!categoryFilter) return true;
  const cat = t.categoryId ? categories.find((c) => c.id === t.categoryId) : null;
  const parentId = cat ? (cat.parentId ?? cat.id) : null;
  return parentId === categoryFilter;
}

export function matchesRangeFilters(
  t: Transaction,
  minAmt: number | null,
  fromMs: number | null,
): boolean {
  const tMs = toMs(t.date);
  if (fromMs !== null && tMs < fromMs) return false;
  if (minAmt !== null && t.amount < minAmt) return false;
  return true;
}

export function matchesFilters(
  t: Transaction,
  categories: Category[],
  search: string,
  categoryFilter: string,
  paymentFilter: string,
  minAmt: number | null,
  fromMs: number | null,
): boolean {
  if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
  if (!matchesCategoryFilter(t, categories, categoryFilter)) return false;
  if (paymentFilter && t.paymentMethod !== paymentFilter) return false;
  return matchesRangeFilters(t, minAmt, fromMs);
}
