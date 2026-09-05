"use client";

import { ArrowDown, ArrowUp, CreditCard, MoreHorizontal, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { TransactionAmount } from "../transactions/TransactionAmount";
import type { SharedProps } from "./TransactionTableDesktop";
import { fmtDate, PAYMENT_LABELS, type SortDir, type SortKey } from "./transactionTableFilters";

type MobileProps = SharedProps & {
  sortKey: SortKey | null;
  setSortKey: (key: SortKey | null) => void;
  sortDir: SortDir;
  setSortDir: (dir: SortDir | ((d: SortDir) => SortDir)) => void;
};

export function TransactionTableMobile({
  paginated,
  byPersonId,
  byCategoryId,
  deletingId,
  handleDelete,
  onEdit,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
}: MobileProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={sortKey ?? ""}
          onChange={(e) => {
            setSortKey((e.target.value as SortKey) || null);
            setSortDir("asc");
          }}
          className="h-8 text-xs flex-1"
        >
          <option value="">Ordenar por...</option>
          <option value="date">Data</option>
          <option value="amount">Valor</option>
        </Select>
        {sortKey && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label="Direção"
          >
            {sortDir === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      {paginated.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nenhum resultado encontrado
        </p>
      ) : (
        paginated.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm truncate">{t.description || "—"}</span>
                {t.isRecurring && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    Recorrente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <TransactionAmount type={t.type} amount={t.amount} />
                <DropdownMenu
                  align="right"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      aria-label="Ações"
                      disabled={deletingId === t.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={[
                    ...(!t.isRecurring && onEdit
                      ? [{ label: "Editar", onClick: () => onEdit(t) }]
                      : []),
                    {
                      label: deletingId === t.id ? "Excluindo..." : "Excluir",
                      onClick: () => handleDelete(t.id, t.isRecurring),
                      variant: "destructive" as const,
                    },
                  ]}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {fmtDate(t.date)}
              {byPersonId[t.personId] && <> &bull; {byPersonId[t.personId]}</>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_LABELS[t.paymentMethod] && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">
                  <CreditCard className="w-3 h-3" />
                  {PAYMENT_LABELS[t.paymentMethod]}
                </span>
              )}
              {t.categoryId && byCategoryId[t.categoryId] && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  {byCategoryId[t.categoryId]}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
