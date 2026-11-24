"use client";

import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
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

function buildCardDescription(tx: Transaction, hidden: boolean): string {
  const cost =
    tx.costBrl && tx.type === "PURCHASE" ? maskCurrency(formatBrl(tx.costBrl), hidden) : "";
  return [tx.description ?? "", cost].filter(Boolean).join(" · ");
}

function buildCardStats(tx: Transaction, hidden: boolean): { label: string; value: ReactNode }[] {
  const costPer1k = formatCostPer1k(tx, hidden);
  const roi = formatRoi(tx);
  const stats: { label: string; value: ReactNode }[] = [];
  if (costPer1k !== "—") stats.push({ label: "Custo/1k", value: costPer1k });
  if (roi) {
    const color = roi.positive ? "text-green-600 dark:text-green-400" : "text-red-500";
    stats.push({ label: "ROI", value: <span className={color}>{roi.text}</span> });
  }
  if (tx.expiresAt) stats.push({ label: "Expira", value: formatDate(tx.expiresAt) });
  return stats;
}

export function TransactionCard({
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
  const description = buildCardDescription(tx, hidden);
  const stats = buildCardStats(tx, hidden);

  return (
    <div
      data-testid="loyalty-transaction-card"
      data-tx-id={tx.id}
      className="rounded-xl border bg-card p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className={`font-semibold text-sm ${TYPE_COLORS[tx.type] ?? ""}`}>
            {TYPE_LABELS[tx.type] ?? tx.type}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-sm font-semibold">{pointsSign(tx.type, tx.points)}</span>
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
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground break-words">{description}</p>}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t pt-2">
          {stats.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground"
            >
              {s.label}: {s.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type SortKey = "date" | "expiresAt";

export function TransactionCardList({
  transactions,
  sortKey,
  sortDir,
  onSortKeyChange,
  onToggleSortDir,
  deletingId,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKeyChange: (key: SortKey) => void;
  onToggleSortDir: () => void;
  deletingId: string | null;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  return (
    <div data-testid="loyalty-transaction-cards" className="md:hidden flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={sortKey}
          onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          aria-label="Ordenar por"
          className="h-8 text-xs flex-1"
        >
          <option value="date">Data</option>
          <option value="expiresAt">Expiração</option>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={onToggleSortDir}
          aria-label="Direção"
        >
          {sortDir === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      {transactions.map((tx) => (
        <TransactionCard
          key={tx.id}
          tx={tx}
          deletingId={deletingId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
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
