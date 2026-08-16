"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, CreditCard, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFilteredSortedInstallments } from "@/hooks/useFilteredSortedInstallments";
import { useInstallmentActions } from "@/hooks/useInstallmentActions";
import { formatDatePtBR } from "@/lib/format-date";
import { InstallmentSummaryPanel } from "./InstallmentSummaryPanel";
import type { Installment, InstallmentFilters, SortDir, SortKey } from "./InstallmentTable.types";

export type { Installment, InstallmentFilters, SortDir, SortKey } from "./InstallmentTable.types";

type Person = { id: string; name: string };
type CreditCardItem = { id: string; name: string };

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatusBadge({ inst }: { inst: Installment }) {
  if (inst.isPaid) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        Pago
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Pendente
    </span>
  );
}

function SortIcon({
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

// ── Sub-components ────────────────────────────────────────────────────────────

type ActionItem = { label: string; onClick: () => void; variant?: "destructive" };

type SharedProps = {
  paginated: Installment[];
  byPersonId: Record<string, string>;
  byCardId: Record<string, string>;
  loadingId: string | null;
  handleDelete: (id: string) => void;
  handleMarkPaid: (id: string) => void;
  onEditInstallment?: (inst: Installment) => void;
  onEditPurchase?: (inst: Installment) => void;
};

function buildActions(
  inst: Installment,
  loadingId: string | null,
  handleDelete: (id: string) => void,
  handleMarkPaid: (id: string) => void,
  onEditInstallment?: (inst: Installment) => void,
  onEditPurchase?: (inst: Installment) => void,
): ActionItem[] {
  const actions: ActionItem[] = [];
  if (onEditInstallment)
    actions.push({ label: "Editar parcela", onClick: () => onEditInstallment(inst) });
  if (onEditPurchase) actions.push({ label: "Editar compra", onClick: () => onEditPurchase(inst) });
  if (!inst.isPaid)
    actions.push({
      label: loadingId === inst.id ? "Salvando…" : "Marcar pago",
      onClick: () => handleMarkPaid(inst.id),
    });
  actions.push({
    label: loadingId === inst.id ? "Excluindo…" : "Excluir",
    onClick: () => handleDelete(inst.id),
    variant: "destructive",
  });
  return actions;
}

type InstallmentRowView = {
  description: string;
  installmentLabel: string;
  personName: string | null;
  cardName: string | null;
  dateStr: string;
};

function buildInstallmentRowView(
  inst: Installment,
  byPersonId: Record<string, string>,
  byCardId: Record<string, string>,
): InstallmentRowView {
  const description = inst.purchaseDescription || "Sem descrição";
  const installmentLabel = inst.numberOfInstallments
    ? `${inst.installmentNumber}/${inst.numberOfInstallments}`
    : `${inst.installmentNumber}`;
  const personName = inst.personId ? (byPersonId[inst.personId] ?? null) : null;
  const cardName = inst.creditCardId ? (byCardId[inst.creditCardId] ?? null) : null;
  const dateStr = inst.purchaseDate
    ? formatDatePtBR(
        typeof inst.purchaseDate === "string" ? inst.purchaseDate : inst.purchaseDate.toISOString(),
      )
    : "—";
  return { description, installmentLabel, personName, cardName, dateStr };
}

type DesktopProps = SharedProps & {
  sortKey: SortKey | null;
  sortDir: SortDir;
  toggleSort: (key: SortKey) => void;
};

function InstallmentTableDesktop({
  paginated,
  byPersonId,
  byCardId,
  loadingId,
  handleDelete,
  handleMarkPaid,
  onEditInstallment,
  onEditPurchase,
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
              className="cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("description")}
            >
              <span className="inline-flex items-center">
                Compra
                <SortIcon col="description" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("date")}
            >
              <span className="inline-flex items-center">
                Data
                <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("amount")}
            >
              <span className="inline-flex items-center justify-end w-full">
                Valor
                <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                Nenhuma parcela encontrada
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((inst) => {
              const description = inst.purchaseDescription || "Sem descrição";
              const installmentLabel = inst.numberOfInstallments
                ? `Parcela ${inst.installmentNumber}/${inst.numberOfInstallments}`
                : `Parcela ${inst.installmentNumber}`;
              const personName = inst.personId ? (byPersonId[inst.personId] ?? null) : null;
              const cardName = inst.creditCardId ? (byCardId[inst.creditCardId] ?? null) : null;
              const metaParts = [installmentLabel, personName, cardName].filter(Boolean);
              const dateStr = inst.purchaseDate
                ? formatDatePtBR(
                    typeof inst.purchaseDate === "string"
                      ? inst.purchaseDate
                      : inst.purchaseDate.toISOString(),
                  )
                : "—";
              const actions = buildActions(
                inst,
                loadingId,
                handleDelete,
                handleMarkPaid,
                onEditInstallment,
                onEditPurchase,
              );

              return (
                <TableRow key={inst.id} className="group">
                  <TableCell>
                    <p className="text-sm font-medium">{description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metaParts.join(" · ")}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{dateStr}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-sm">
                    {fmt(inst.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge inst={inst} />
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
                          disabled={loadingId === inst.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      }
                      items={actions}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

type MobileProps = SharedProps & {
  sortKey: SortKey | null;
  setSortKey: (key: SortKey | null) => void;
  sortDir: SortDir;
  setSortDir: (dir: SortDir | ((d: SortDir) => SortDir)) => void;
};

function InstallmentTableMobile({
  paginated,
  byPersonId,
  byCardId,
  loadingId,
  handleDelete,
  handleMarkPaid,
  onEditInstallment,
  onEditPurchase,
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

      {paginated.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhuma parcela encontrada</p>
      ) : (
        paginated.map((inst) => {
          const { description, installmentLabel, personName, cardName, dateStr } =
            buildInstallmentRowView(inst, byPersonId, byCardId);
          const actions = buildActions(
            inst,
            loadingId,
            handleDelete,
            handleMarkPaid,
            onEditInstallment,
            onEditPurchase,
          );

          return (
            <div key={inst.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm truncate">{description}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-semibold text-sm tabular-nums">{fmt(inst.amount)}</span>
                  <DropdownMenu
                    align="right"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        aria-label="Ações"
                        disabled={loadingId === inst.id}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    }
                    items={actions}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {dateStr}
                {personName && <> &bull; {personName}</>}
                {cardName && <> &bull; {cardName}</>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">
                  Parcela {installmentLabel}
                </span>
                <StatusBadge inst={inst} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InstallmentTable({
  installments,
  people = [],
  creditCards = [],
  filters,
  onEditInstallment,
  onEditPurchase,
}: {
  installments: Installment[];
  people?: Person[];
  creditCards?: CreditCardItem[];
  filters?: InstallmentFilters;
  onEditInstallment?: (inst: Installment) => void;
  onEditPurchase?: (inst: Installment) => void;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);

  const byPersonId = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.name])), [people]);
  const byCardId = useMemo(
    () => Object.fromEntries(creditCards.map((c) => [c.id, c.name])),
    [creditCards],
  );

  const { loadingId, handleDelete, handleMarkPaid } = useInstallmentActions();
  const {
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginated,
  } = useFilteredSortedInstallments(installments, filters);

  if (installments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <CreditCard className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma parcela neste mês</p>
      </div>
    );
  }

  const sharedProps = {
    paginated,
    byPersonId,
    byCardId,
    loadingId,
    handleDelete,
    handleMarkPaid,
    onEditInstallment,
    onEditPurchase,
  };

  return (
    <div className="flex flex-col gap-4">
      <InstallmentSummaryPanel
        installments={installments}
        open={summaryOpen}
        onToggle={() => setSummaryOpen((o) => !o)}
      />

      <div className="hidden md:block">
        <InstallmentTableDesktop
          {...sharedProps}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
      </div>
      <div className="md:hidden">
        <InstallmentTableMobile
          {...sharedProps}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <PageSizeSelector value={pageSize} onChange={setPageSize} />
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
