"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  Tag,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCardRefundForm } from "@/components/credit-cards/CreditCardRefundForm";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { UnifiedTransactionForm } from "@/components/transactions/UnifiedTransactionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstallmentFilters } from "@/hooks/useInstallmentFilters";
import { getFullPath } from "@/lib/categoryUtils";
import { formatDatePtBR } from "@/lib/format-date";
import { maskCurrency } from "@/lib/maskCurrency";
import { formatAmountBR } from "@/lib/utils";
import type { BillInstallmentItem, BillSortDir, BillSortKey } from "./BillView.types";

export type { BillInstallmentItem, BillSortDir, BillSortKey } from "./BillView.types";

const SUMMARY_SKELETONS = ["a", "b", "c", "d"];
const ROW_SKELETONS = ["a", "b", "c", "d", "e"];

function BillSortIcon({
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

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };
type CreditCardFull = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

type PurchaseRecord = {
  id: string;
  personId: string;
  creditCardId: string | null;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: string;
  categoryId: string | null;
};

type RefundItem = {
  id: string;
  creditCardId: string;
  personId: string;
  description: string;
  amount: number;
  refundDate: string;
  categoryId: string | null;
};

type BillEntry = {
  card: { id: string; name: string };
  dueDayOfMonth: number;
  installments: BillInstallmentItem[];
  refunds: RefundItem[];
  total: number;
};

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function useMaskedCurrency() {
  const { hidden } = usePrivacy();
  return (value: number) => maskCurrency(formatCurrency(value), hidden);
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-lg font-semibold leading-none">{value}</p>
      </div>
    </Card>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type CardInstallmentSharedProps = {
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

type CardInstallmentDesktopProps = CardInstallmentSharedProps & {
  sortKey: BillSortKey | null;
  sortDir: BillSortDir;
  toggleSort: (key: BillSortKey) => void;
};

function CardInstallmentTableDesktop({
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
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th
              className="px-5 py-2.5 font-medium text-xs cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("description")}
            >
              <span className="inline-flex items-center">
                Compra
                <BillSortIcon col="description" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className="px-5 py-2.5 font-medium text-xs">Parcela</th>
            <th
              className="px-5 py-2.5 font-medium text-xs cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("date")}
            >
              <span className="inline-flex items-center">
                Data
                <BillSortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className="px-5 py-2.5 font-medium text-xs">Pessoa</th>
            <th className="px-5 py-2.5 font-medium text-xs">Categoria</th>
            <th
              className="px-5 py-2.5 font-medium text-xs text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => toggleSort("amount")}
            >
              <span className="inline-flex items-center justify-end w-full">
                Valor
                <BillSortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </th>
            <th className="px-5 py-2.5 font-medium text-xs w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((inst) => {
            const isDeleting = deletingId === inst.creditCardPurchaseId;
            return (
              <tr
                key={inst.id}
                className={`border-b last:border-0 transition-colors${inst.isPaid ? " bg-green-50 dark:bg-green-900/10 hover:bg-green-100" : " hover:bg-muted/20"}${isDeleting ? " opacity-50" : ""}`}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-sm">
                    {inst.purchaseDescription || "Sem descrição"}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {inst.installmentNumber}/{inst.numberOfInstallments}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {formatDatePtBR(inst.purchaseDate)}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {personMap.get(inst.personId) ?? "—"}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {inst.categoryId ? (categoryMap.get(inst.categoryId) ?? "—") : "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium text-sm">
                  {inst.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-5 py-3 text-right">
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
                </td>
              </tr>
            );
          })}
          {refunds.map((refund) => {
            const isDeleting = deletingRefundId === refund.id;
            return (
              <tr
                key={refund.id}
                className={`border-b last:border-0 transition-colors hover:bg-muted/20${isDeleting ? " opacity-50" : ""}`}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-sm">{refund.description || "Estorno"}</p>
                </td>
                <td className="px-5 py-3">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                  >
                    Estorno
                  </Badge>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {formatDatePtBR(refund.refundDate)}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {personMap.get(refund.personId) ?? "—"}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {refund.categoryId ? (categoryMap.get(refund.categoryId) ?? "—") : "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium text-sm text-green-600 dark:text-green-400">
                  − {refund.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-5 py-3 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type CardInstallmentMobileProps = CardInstallmentSharedProps & {
  sortKey: BillSortKey | null;
  setSortKey: (key: BillSortKey | null) => void;
  sortDir: BillSortDir;
  setSortDir: (dir: BillSortDir | ((d: BillSortDir) => BillSortDir)) => void;
};

function CardInstallmentTableMobile({
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

// ── CardInstallmentTable ──────────────────────────────────────────────────────

function CardInstallmentTable({
  installments,
  refunds,
  personMap,
  categoryMap,
  onEdit,
  onDelete,
  deletingId,
  onDeleteRefund,
  deletingRefundId,
}: {
  installments: BillInstallmentItem[];
  refunds: RefundItem[];
  personMap: Map<string, string>;
  categoryMap: Map<string, string>;
  onEdit: (purchaseId: string) => void;
  onDelete: (purchaseId: string) => void;
  deletingId: string | null;
  onDeleteRefund: (refundId: string) => void;
  deletingRefundId: string | null;
}) {
  const {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    dateFrom,
    setDateFrom,
    amountMin,
    setAmountMin,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    toggleSort,
    usedCategories,
    sorted,
  } = useInstallmentFilters(installments, categoryMap);

  const sharedProps = {
    sorted,
    refunds,
    personMap,
    categoryMap,
    onEdit,
    onDelete,
    deletingId,
    onDeleteRefund,
    deletingRefundId,
  };

  return (
    <>
      {/* Filters */}
      <div className="px-5 py-2 border-b flex gap-2 flex-wrap">
        <Input
          placeholder="Buscar descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-full sm:w-44 text-xs"
        />
        {usedCategories.length > 1 && (
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-7 w-40 text-xs"
          >
            <option value="">Todas categorias</option>
            {usedCategories.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}
        <DatePicker
          value={dateFrom}
          onChange={setDateFrom}
          placeholder="Data"
          className="h-7 w-36 text-xs"
        />
        <Input
          type="number"
          placeholder="Valor mín"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          className="h-7 w-28 text-xs"
          min={0}
        />
        {(search || categoryFilter || dateFrom || amountMin) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setCategoryFilter("");
              setDateFrom("");
              setAmountMin("");
            }}
          >
            Limpar ×
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <CardInstallmentTableDesktop
          {...sharedProps}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
      </div>
      <div className="md:hidden">
        <CardInstallmentTableMobile
          {...sharedProps}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      </div>
    </>
  );
}

function isCardFullyPaid(installments: BillInstallmentItem[]): boolean {
  return installments.length > 0 && installments.every((i) => i.isPaid);
}

function formatItemsSummary(entry: BillEntry): string {
  const itemsLabel = `${entry.installments.length} ${entry.installments.length === 1 ? "item" : "itens"}`;
  if (entry.refunds.length === 0) return itemsLabel;
  const refundsLabel = entry.refunds.length === 1 ? "estorno" : "estornos";
  return `${itemsLabel} · ${entry.refunds.length} ${refundsLabel}`;
}

function CardHeaderRow({
  entry,
  isOpen,
  allPaid,
  paying,
  unpaying,
  onPayFatura,
  onUnpayFatura,
}: {
  entry: BillEntry;
  isOpen: boolean;
  allPaid: boolean;
  paying: Set<string>;
  unpaying: Set<string>;
  onPayFatura: (cardId: string, installments: BillInstallmentItem[]) => void;
  onUnpayFatura: (cardId: string, installments: BillInstallmentItem[]) => void;
}) {
  const formatCurrencyMasked = useMaskedCurrency();
  return (
    <CollapsibleTrigger
      className={`no-active-scale w-full rounded-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b transition-colors text-left ${
        allPaid
          ? "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800"
          : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{entry.card.name}</p>
            {allPaid && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Paga
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Vence: dia {entry.dueDayOfMonth}</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
        {entry.installments.some((i) => !i.isPaid) && (
          <Button
            variant="outline"
            size="sm"
            disabled={paying.has(entry.card.id)}
            onClick={(e) => {
              e.stopPropagation();
              onPayFatura(entry.card.id, entry.installments);
            }}
          >
            {paying.has(entry.card.id) ? "Pagando…" : "Pagar fatura"}
          </Button>
        )}
        {entry.installments.some((i) => i.isPaid) && (
          <Button
            variant="destructive"
            size="sm"
            disabled={unpaying.has(entry.card.id)}
            onClick={(e) => {
              e.stopPropagation();
              onUnpayFatura(entry.card.id, entry.installments);
            }}
          >
            {unpaying.has(entry.card.id) ? "Estornando…" : "Estornar fatura"}
          </Button>
        )}
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm">{formatCurrencyMasked(entry.total)}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatItemsSummary(entry)}
          </p>
        </div>
      </div>
    </CollapsibleTrigger>
  );
}

type BillViewProps = {
  initialPersonId?: string;
};

export function BillView({ initialPersonId = "" }: BillViewProps) {
  const formatCurrencyMasked = useMaskedCurrency();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bill, setBill] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardFull[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState<Set<string>>(new Set());
  const [unpaying, setUnpaying] = useState<Set<string>>(new Set());

  const [showAdd, setShowAdd] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddRefund, setShowAddRefund] = useState(false);
  const [deletingRefundId, setDeletingRefundId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/people").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/credit-cards").then((r) => r.json()),
    ]).then(([pd, cd, cc]) => {
      setPeople(pd.people ?? []);
      setCategories(cd.categories ?? []);
      setCreditCards(cc.cards ?? []);
    });
  }, []);

  useEffect(() => {
    if (!editingPurchaseId) {
      setEditingPurchase(null);
      return;
    }
    fetch(`/api/credit-card-purchases/${editingPurchaseId}`)
      .then((r) => r.json())
      .then((d) => setEditingPurchase(d.purchase ?? null));
  }, [editingPurchaseId]);

  const load = useCallback(async (y: number, m: number, pid: string) => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    if (pid) params.set("personId", pid);
    const res = await fetch(`/api/credit-cards/bill?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data.bill);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(year, month, initialPersonId);
  }, [year, month, initialPersonId, load]);

  function prev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  async function deletePurchase(purchaseId: string) {
    setDeletingId(purchaseId);
    const res = await fetch(`/api/credit-card-purchases/${purchaseId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    toast.success("Compra excluída.");
    load(year, month, initialPersonId);
  }

  async function deleteRefund(refundId: string) {
    setDeletingRefundId(refundId);
    const res = await fetch(`/api/credit-card-refunds/${refundId}`, { method: "DELETE" });
    setDeletingRefundId(null);
    if (!res.ok) {
      toast.error("Falha ao excluir estorno.");
      return;
    }
    toast.success("Estorno excluído.");
    load(year, month, initialPersonId);
  }

  async function payFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => !i.isPaid).map((i) => i.id);
    if (ids.length === 0) return;
    setPaying((prev) => new Set(prev).add(cardId));
    setBill((prev) =>
      prev.map((entry) =>
        entry.card.id === cardId
          ? {
              ...entry,
              installments: entry.installments.map((i) =>
                ids.includes(i.id) ? { ...i, isPaid: true } : i,
              ),
            }
          : entry,
      ),
    );
    try {
      const res = await fetch("/api/installments/bulk-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Erro ao pagar fatura");
      toast.success("Fatura paga com sucesso.");
    } catch {
      setBill((prev) =>
        prev.map((entry) =>
          entry.card.id === cardId
            ? {
                ...entry,
                installments: entry.installments.map((i) =>
                  ids.includes(i.id) ? { ...i, isPaid: false } : i,
                ),
              }
            : entry,
        ),
      );
      toast.error("Erro ao pagar fatura.");
    } finally {
      setPaying((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  }

  async function unpayFatura(cardId: string, installments: BillInstallmentItem[]) {
    const ids = installments.filter((i) => i.isPaid).map((i) => i.id);
    if (ids.length === 0) return;
    setUnpaying((prev) => new Set(prev).add(cardId));
    setBill((prev) =>
      prev.map((entry) =>
        entry.card.id === cardId
          ? {
              ...entry,
              installments: entry.installments.map((i) =>
                ids.includes(i.id) ? { ...i, isPaid: false } : i,
              ),
            }
          : entry,
      ),
    );
    try {
      const res = await fetch("/api/installments/bulk-unpaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Erro ao estornar fatura");
      toast.success("Fatura estornada com sucesso.");
    } catch {
      setBill((prev) =>
        prev.map((entry) =>
          entry.card.id === cardId
            ? {
                ...entry,
                installments: entry.installments.map((i) =>
                  ids.includes(i.id) ? { ...i, isPaid: true } : i,
                ),
              }
            : entry,
        ),
      );
      toast.error("Erro ao estornar fatura.");
    } finally {
      setUnpaying((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  }

  function toggleCollapse(cardId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  const personMap = new Map(people.map((p) => [p.id, p.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, getFullPath(c.id, categories)]));
  const totalBill = bill.reduce((sum, e) => sum + e.total, 0);
  const totalItems = bill.reduce((sum, e) => sum + e.installments.length, 0);
  const uniquePeople = new Set(bill.flatMap((e) => e.installments.map((i) => i.personId))).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Add dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Nova transação">
        <UnifiedTransactionForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          allowedTypes={["credit"]}
          initialValues={{
            type: "credit",
            personId: initialPersonId,
            amount: "",
            date: today,
            paymentMethod: "CREDIT_CARD",
            source: "SALARY",
            creditCardId: "",
            categoryId: "",
            description: "",
          }}
          onSuccess={() => {
            setShowAdd(false);
            load(year, month, initialPersonId);
          }}
        />
      </Dialog>

      {/* Add refund dialog */}
      <Dialog open={showAddRefund} onClose={() => setShowAddRefund(false)} title="Novo estorno">
        <CreditCardRefundForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          defaultPersonId={initialPersonId}
          onSuccess={() => {
            setShowAddRefund(false);
            load(year, month, initialPersonId);
          }}
        />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingPurchase}
        onClose={() => setEditingPurchaseId(null)}
        title="Editar compra"
      >
        {editingPurchase && (
          <UnifiedTransactionForm
            people={people}
            categories={categories}
            creditCards={creditCards}
            editMode={{ purchaseId: editingPurchase.id }}
            initialValues={{
              type: "credit",
              personId: editingPurchase.personId,
              amount: formatAmountBR(editingPurchase.totalAmount),
              date: editingPurchase.purchaseDate.toString().split("T")[0],
              paymentMethod: "CREDIT_CARD",
              source: "SALARY",
              creditCardId: editingPurchase.creditCardId ?? "",
              categoryId: editingPurchase.categoryId ?? "",
              description: editingPurchase.description,
            }}
            onSuccess={() => {
              setEditingPurchaseId(null);
              load(year, month, initialPersonId);
            }}
          />
        )}
      </Dialog>

      {/* Filters + Nova compra */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prev}>
            ←
          </Button>
          <span className="font-medium capitalize">{formatMonth(year, month)}</span>
          <Button variant="outline" size="sm" onClick={next}>
            →
          </Button>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setShowAddRefund(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Estorno
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova compra
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUMMARY_SKELETONS.map((s) => (
              <Skeleton key={s} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {ROW_SKELETONS.map((s) => (
              <Skeleton key={s} className="h-12 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Receipt className="w-5 h-5" />}
              label="Total da fatura"
              value={formatCurrencyMasked(totalBill)}
            />
            <SummaryCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Cartões"
              value={String(bill.length)}
            />
            <SummaryCard
              icon={<Package className="w-5 h-5" />}
              label="Parcelas"
              value={String(totalItems)}
            />
            <SummaryCard
              icon={<Users className="w-5 h-5" />}
              label="Pessoas"
              value={String(uniquePeople)}
            />
          </div>

          {/* Empty state */}
          {bill.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground border rounded-lg">
              <CreditCard className="w-10 h-10 opacity-25" />
              <p className="text-sm font-medium">Nenhuma parcela de cartão neste mês</p>
              <p className="text-xs">Tente navegar para outro mês ou remover o filtro de pessoa.</p>
            </div>
          )}

          {/* Card groups */}
          {bill.map((entry) => {
            const isOpen = !collapsed.has(entry.card.id);
            const allPaid = isCardFullyPaid(entry.installments);
            return (
              <Collapsible
                key={entry.card.id}
                open={isOpen}
                onOpenChange={() => toggleCollapse(entry.card.id)}
              >
                <Card className={`overflow-hidden${allPaid ? " ring-1 ring-green-500" : ""}`}>
                  {/* Card header */}
                  <CardHeaderRow
                    entry={entry}
                    isOpen={isOpen}
                    allPaid={allPaid}
                    paying={paying}
                    unpaying={unpaying}
                    onPayFatura={payFatura}
                    onUnpayFatura={unpayFatura}
                  />

                  <CollapsibleContent>
                    <CardInstallmentTable
                      installments={entry.installments}
                      refunds={entry.refunds}
                      personMap={personMap}
                      categoryMap={categoryMap}
                      onEdit={setEditingPurchaseId}
                      onDelete={deletePurchase}
                      deletingId={deletingId}
                      onDeleteRefund={deleteRefund}
                      deletingRefundId={deletingRefundId}
                    />
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </>
      )}
    </div>
  );
}
