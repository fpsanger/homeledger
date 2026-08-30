import type { BillEntry, BillInstallmentItem } from "./BillView.types";

export function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function isCardFullyPaid(installments: BillInstallmentItem[]): boolean {
  return installments.length > 0 && installments.every((i) => i.isPaid);
}

export function formatItemsSummary(entry: BillEntry): string {
  const itemsLabel = `${entry.installments.length} ${entry.installments.length === 1 ? "item" : "itens"}`;
  if (entry.refunds.length === 0) return itemsLabel;
  const refundsLabel = entry.refunds.length === 1 ? "estorno" : "estornos";
  return `${itemsLabel} · ${entry.refunds.length} ${refundsLabel}`;
}
