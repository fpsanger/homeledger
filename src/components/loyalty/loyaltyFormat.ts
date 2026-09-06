import { formatDatePtBR } from "@/lib/format-date";
import { maskCurrency } from "@/lib/maskCurrency";

export type FifoData = {
  costBrl: number;
  costPer1kPoints: number;
  roi: number | null;
};

export type Transaction = {
  id: string;
  type: string;
  points: number;
  date: string;
  description: string | null;
  expiresAt: string | null;
  costBrl: number | null;
  valueBrl: number | null;
  transferId: string | null;
  personId: string | null;
  fifoData?: FifoData;
};

export const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Compra",
  EARN: "Acúmulo",
  BONUS: "Bônus",
  REDEEM: "Resgate",
  TRANSFER_OUT: "Transferência Saída",
  TRANSFER_IN: "Transferência Entrada",
  EXPIRE: "Expiração",
  ADJUSTMENT: "Ajuste",
};

export const TYPE_COLORS: Record<string, string> = {
  PURCHASE: "text-blue-600 dark:text-blue-400",
  EARN: "text-green-600 dark:text-green-400",
  BONUS: "text-emerald-600 dark:text-emerald-400",
  REDEEM: "text-orange-600 dark:text-orange-400",
  TRANSFER_OUT: "text-red-500 dark:text-red-400",
  TRANSFER_IN: "text-indigo-600 dark:text-indigo-400",
  EXPIRE: "text-rose-600 dark:text-rose-400",
  ADJUSTMENT: "text-muted-foreground",
};

export const TRANSACTION_TYPES = [
  { value: "PURCHASE", label: "Compra" },
  { value: "EARN", label: "Acúmulo" },
  { value: "BONUS", label: "Bônus" },
  { value: "REDEEM", label: "Resgate" },
  { value: "EXPIRE", label: "Expiração" },
  { value: "ADJUSTMENT", label: "Ajuste" },
];

export const EDITABLE_TYPES = ["PURCHASE", "EARN", "BONUS", "REDEEM", "EXPIRE", "ADJUSTMENT"];

export function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPts(value: number) {
  return `${value.toLocaleString("pt-BR")} pts`;
}

export function formatDate(iso: string) {
  return formatDatePtBR(iso);
}

export function pointsSign(type: string, points: number) {
  const negative =
    ["REDEEM", "TRANSFER_OUT", "EXPIRE"].includes(type) || (type === "ADJUSTMENT" && points < 0);
  return negative
    ? `-${Math.abs(points).toLocaleString("pt-BR")}`
    : `+${points.toLocaleString("pt-BR")}`;
}

export function formatCostPer1k(tx: Transaction, hidden: boolean): string {
  if (tx.fifoData && Number.isFinite(tx.fifoData.costPer1kPoints)) {
    return maskCurrency(formatBrl(tx.fifoData.costPer1kPoints), hidden);
  }
  if (tx.type === "PURCHASE" && tx.costBrl && tx.points > 0) {
    return maskCurrency(formatBrl((tx.costBrl / tx.points) * 1000), hidden);
  }
  return "—";
}

export function formatRoi(tx: Transaction): { text: string; positive: boolean } | null {
  if (tx.fifoData?.roi == null || !Number.isFinite(tx.fifoData.roi)) return null;
  return { text: `${tx.fifoData.roi.toFixed(1)}%`, positive: tx.fifoData.roi >= 0 };
}
