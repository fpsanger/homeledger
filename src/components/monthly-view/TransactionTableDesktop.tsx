"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
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
import { TransactionAmount } from "../transactions/TransactionAmount";
import { buildRowActions } from "./rowActions";
import {
  fmtDate,
  PAYMENT_LABELS,
  type SortDir,
  type SortKey,
  type Transaction,
} from "./transactionTableFilters";

export function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
}) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1" />
  );
}

function TransactionRow({
  t,
  byPersonId,
  byCategoryId,
  showCategoryCol,
  deletingId,
  handleDelete,
  onEdit,
  onEditRecurring,
}: {
  t: Transaction;
  byPersonId: Record<string, string>;
  byCategoryId: Record<string, string>;
  showCategoryCol: boolean;
  deletingId: string | null;
  handleDelete: (id: string, isRecurring?: boolean) => void;
  onEdit?: (t: Transaction) => void;
  onEditRecurring?: (t: Transaction) => void;
}) {
  return (
    <TableRow className="group">
      <TableCell className="text-sm text-muted-foreground tabular-nums">
        {fmtDate(t.date)}
      </TableCell>
      <TableCell className="text-sm">{byPersonId[t.personId] ?? t.personId}</TableCell>
      <TableCell className="text-sm">
        <span className="inline-flex items-center gap-2">
          {t.description || "—"}
          {t.isRecurring && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              Recorrente
            </span>
          )}
        </span>
      </TableCell>
      {showCategoryCol && (
        <TableCell className="text-sm text-muted-foreground">
          {t.categoryId ? (byCategoryId[t.categoryId] ?? "—") : "—"}
        </TableCell>
      )}
      <TableCell className="text-sm text-muted-foreground">
        {PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums text-sm">
        <TransactionAmount type={t.type} amount={t.amount} />
      </TableCell>
      <TableCell className="text-right">
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
          items={buildRowActions({ t, deletingId, handleDelete, onEdit, onEditRecurring })}
        />
      </TableCell>
    </TableRow>
  );
}

export type SharedProps = {
  paginated: Transaction[];
  byPersonId: Record<string, string>;
  byCategoryId: Record<string, string>;
  showCategoryCol: boolean;
  deletingId: string | null;
  handleDelete: (id: string, isRecurring?: boolean) => void;
  onEdit?: (t: Transaction) => void;
  onEditRecurring?: (t: Transaction) => void;
};

type DesktopProps = SharedProps & {
  sortKey: SortKey | null;
  sortDir: SortDir;
  toggleSort: (key: SortKey) => void;
};

export function TransactionTableDesktop({
  paginated,
  byPersonId,
  byCategoryId,
  showCategoryCol,
  deletingId,
  handleDelete,
  onEdit,
  onEditRecurring,
  sortKey,
  sortDir,
  toggleSort,
}: DesktopProps) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead
              className="w-20 cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("date")}
            >
              <span className="inline-flex items-center">
                Data
                <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead>Pessoa</TableHead>
            <TableHead>Descrição</TableHead>
            {showCategoryCol && <TableHead>Categoria</TableHead>}
            <TableHead>Método</TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("amount")}
            >
              <span className="inline-flex items-center justify-end w-full">
                Valor
                <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showCategoryCol ? 7 : 6}
                className="text-center text-sm text-muted-foreground py-8"
              >
                Nenhum resultado encontrado
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((t) => (
              <TransactionRow
                key={t.id}
                t={t}
                byPersonId={byPersonId}
                byCategoryId={byCategoryId}
                showCategoryCol={showCategoryCol}
                deletingId={deletingId}
                handleDelete={handleDelete}
                onEdit={onEdit}
                onEditRecurring={onEditRecurring}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
