"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDatePtBR } from "@/lib/format-date";
import type { BillInstallmentItem, BillSortDir, BillSortKey, RefundItem } from "./BillView.types";

export type CardInstallmentSharedProps = {
  sorted: BillInstallmentItem[];
  refunds: RefundItem[];
  personMap: Map<string, string>;
  categoryMap: Map<string, string>;
  onEdit: (purchaseId: string) => void;
  onDelete: (purchaseId: string) => void;
  deletingId: string | null;
  onDeleteRefund: (refundId: string) => void;
  deletingRefundId: string | null;
};

export function BillSortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: BillSortKey;
  sortKey: BillSortKey | null;
  sortDir: BillSortDir;
}) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1" />
  );
}

type CardInstallmentDesktopProps = CardInstallmentSharedProps & {
  sortKey: BillSortKey | null;
  sortDir: BillSortDir;
  toggleSort: (key: BillSortKey) => void;
};

export function CardInstallmentTableDesktop({
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
  sortDir,
  toggleSort,
}: CardInstallmentDesktopProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-left text-muted-foreground border-b hover:bg-transparent">
            <TableHead
              className="px-5 py-2.5 font-medium text-xs cursor-pointer select-none hover:text-foreground h-auto"
              onClick={() => toggleSort("description")}
            >
              <span className="inline-flex items-center">
                Compra
                <BillSortIcon col="description" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead className="px-5 py-2.5 font-medium text-xs h-auto">Parcela</TableHead>
            <TableHead
              className="px-5 py-2.5 font-medium text-xs cursor-pointer select-none hover:text-foreground h-auto"
              onClick={() => toggleSort("date")}
            >
              <span className="inline-flex items-center">
                Data
                <BillSortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead className="px-5 py-2.5 font-medium text-xs h-auto">Pessoa</TableHead>
            <TableHead className="px-5 py-2.5 font-medium text-xs h-auto">Categoria</TableHead>
            <TableHead
              className="px-5 py-2.5 font-medium text-xs text-right cursor-pointer select-none hover:text-foreground h-auto"
              onClick={() => toggleSort("amount")}
            >
              <span className="inline-flex items-center justify-end w-full">
                Valor
                <BillSortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead className="px-5 py-2.5 font-medium text-xs w-10 h-auto" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((inst) => {
            const isDeleting = deletingId === inst.creditCardPurchaseId;
            return (
              <TableRow
                key={inst.id}
                className={`border-b last:border-0 transition-colors${inst.isPaid ? " bg-green-50 dark:bg-green-900/10 hover:bg-green-100" : " hover:bg-muted/20"}${isDeleting ? " opacity-50" : ""}`}
              >
                <TableCell className="px-5 py-3">
                  <p className="font-medium text-sm">
                    {inst.purchaseDescription || "Sem descrição"}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {inst.installmentNumber}/{inst.numberOfInstallments}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {formatDatePtBR(inst.purchaseDate)}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {personMap.get(inst.personId) ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {inst.categoryId ? (categoryMap.get(inst.categoryId) ?? "—") : "—"}
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-medium text-sm">
                  {inst.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
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
                </TableCell>
              </TableRow>
            );
          })}
          {refunds.map((refund) => {
            const isDeleting = deletingRefundId === refund.id;
            return (
              <TableRow
                key={refund.id}
                className={`border-b last:border-0 transition-colors hover:bg-muted/20${isDeleting ? " opacity-50" : ""}`}
              >
                <TableCell className="px-5 py-3">
                  <p className="font-medium text-sm">{refund.description || "Estorno"}</p>
                </TableCell>
                <TableCell className="px-5 py-3">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                  >
                    Estorno
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {formatDatePtBR(refund.refundDate)}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {personMap.get(refund.personId) ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {refund.categoryId ? (categoryMap.get(refund.categoryId) ?? "—") : "—"}
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-medium text-sm text-green-600 dark:text-green-400">
                  − {refund.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
