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
  transfer?: { pointsSent: number; pointsReceived: number };
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

export function transferBonusPercent(tx: Transaction): number | null {
  if (tx.type !== "TRANSFER_IN" || !tx.transfer || tx.transfer.pointsSent <= 0) return null;
  const pct = Math.round((tx.transfer.pointsReceived / tx.transfer.pointsSent - 1) * 100);
  return pct > 0 ? pct : null;
}

export type TransferInCost =
  | { kind: "unknown" }
  | { kind: "none" }
  | { kind: "value"; text: string; originText?: string };

export function describeTransferInCost(tx: Transaction, hidden: boolean): TransferInCost | null {
  if (tx.type !== "TRANSFER_IN") return null;
  if (tx.costBrl == null) return { kind: "unknown" };
  if (tx.costBrl === 0) return { kind: "none" };

  const text =
    tx.points > 0 ? maskCurrency(formatBrl((tx.costBrl / tx.points) * 1000), hidden) : "—";
  const { transfer } = tx;
  if (transferBonusPercent(tx) == null || !transfer) return { kind: "value", text };
  const originText = maskCurrency(formatBrl((tx.costBrl / transfer.pointsSent) * 1000), hidden);
  return { kind: "value", text, originText };
}
