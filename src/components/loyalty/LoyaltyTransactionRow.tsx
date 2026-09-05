"use client";

import { MoreHorizontal } from "lucide-react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { maskCurrency } from "@/lib/maskCurrency";
import {
  EDITABLE_TYPES,
  formatBrl,
  formatCostPer1k,
  formatDate,
  formatRoi,
  pointsSign,
  type Transaction,
  TYPE_COLORS,
  TYPE_LABELS,
} from "./loyaltyFormat";

type SortDir = "asc" | "desc";

export function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30">↕</span>;
  return <>{dir === "asc" ? "↑" : "↓"}</>;
}

export function buildTransactionRowActions(
  tx: Transaction,
  deletingId: string | null,
  onEdit: (tx: Transaction) => void,
  onDelete: (tx: Transaction) => void,
) {
  return [
    ...(EDITABLE_TYPES.includes(tx.type) ? [{ label: "Editar", onClick: () => onEdit(tx) }] : []),
    {
      label: deletingId === tx.id ? "Excluindo..." : "Excluir",
      onClick: () => onDelete(tx),
      variant: "destructive" as const,
    },
  ];
}

export function TransactionRow({
  tx,
  deletingId,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  deletingId: string | null;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const { hidden } = usePrivacy();
  const roi = formatRoi(tx);
  return (
    <tr className="border-t hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
      <td className="px-4 py-3">
        <span className={`font-medium ${TYPE_COLORS[tx.type] ?? ""}`}>
          {TYPE_LABELS[tx.type] ?? tx.type}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono">{pointsSign(tx.type, tx.points)}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{formatCostPer1k(tx, hidden)}</td>
      <td className="px-4 py-3 text-right">
        {roi ? (
          <span className={roi.positive ? "text-green-600 dark:text-green-400" : "text-red-500"}>
            {roi.text}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {tx.expiresAt ? formatDate(tx.expiresAt) : "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {tx.description ?? ""}
        {tx.costBrl && tx.type === "PURCHASE"
          ? ` · ${maskCurrency(formatBrl(tx.costBrl), hidden)}`
          : ""}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              disabled={deletingId === tx.id}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Ações"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          }
          items={buildTransactionRowActions(tx, deletingId, onEdit, onDelete)}
        />
      </td>
    </tr>
  );
}
