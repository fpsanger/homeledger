"use client";

import { ArrowDown, ArrowUp, MoreHorizontal, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { formatDatePtBR } from "@/lib/format-date";
import type { CardInstallmentSharedProps } from "./BillInstallmentTableDesktop";
import type { BillSortDir, BillSortKey } from "./BillView.types";

type CardInstallmentMobileProps = CardInstallmentSharedProps & {
  sortKey: BillSortKey | null;
  setSortKey: (key: BillSortKey | null) => void;
  sortDir: BillSortDir;
  setSortDir: (dir: BillSortDir | ((d: BillSortDir) => BillSortDir)) => void;
};

export function CardInstallmentTableMobile({
  sorted,
  refunds,
  personMap,
  categoryMap,
  onEdit,
  onDelete,
  deletingId,
  onDeleteRefund,
  deletingRefundId,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
}: CardInstallmentMobileProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <Select
          value={sortKey ?? ""}
          onChange={(e) => {
            setSortKey((e.target.value as BillSortKey) || null);
            setSortDir("asc");
          }}
          className="h-8 text-xs flex-1"
        >
          <option value="">Ordenar por...</option>
          <option value="description">Compra</option>
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
      {sorted.map((inst) => {
        const isDeleting = deletingId === inst.creditCardPurchaseId;
        const personName = personMap.get(inst.personId);
        const categoryName = inst.categoryId ? categoryMap.get(inst.categoryId) : null;
        return (
          <div
            key={inst.id}
            className={`rounded-xl border bg-card p-4 flex flex-col gap-2${isDeleting ? " opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm truncate">
                {inst.purchaseDescription || "Sem descrição"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-semibold text-sm">
                  {inst.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <DropdownMenu
                  align="right"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      aria-label="Ações"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={[
                    { label: "Editar compra", onClick: () => onEdit(inst.creditCardPurchaseId) },
                    {
                      label: isDeleting ? "Excluindo…" : "Excluir compra",
                      onClick: () => onDelete(inst.creditCardPurchaseId),
                      variant: "destructive",
                    },
                  ]}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDatePtBR(inst.purchaseDate)}
              {personName && <> &bull; {personName}</>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="font-mono text-xs">
                {inst.installmentNumber}/{inst.numberOfInstallments}
              </Badge>
              {categoryName && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {refunds.map((refund) => {
        const isDeleting = deletingRefundId === refund.id;
        const personName = personMap.get(refund.personId);
        const categoryName = refund.categoryId ? categoryMap.get(refund.categoryId) : null;
        return (
          <div
            key={refund.id}
            className={`rounded-xl border bg-card p-4 flex flex-col gap-2${isDeleting ? " opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm truncate">
                {refund.description || "Estorno"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-semibold text-sm text-green-600 dark:text-green-400">
                  − {refund.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <DropdownMenu
                  align="right"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      aria-label="Ações"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={[
                    {
                      label: isDeleting ? "Excluindo…" : "Excluir estorno",
                      onClick: () => onDeleteRefund(refund.id),
                      variant: "destructive",
                    },
                  ]}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDatePtBR(refund.refundDate)}
              {personName && <> &bull; {personName}</>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="font-mono text-xs border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                Estorno
              </Badge>
              {categoryName && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
