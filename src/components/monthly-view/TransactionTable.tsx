"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Receipt, TrendingDown, TrendingUp, Wallet, Hash, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { TransactionAmount } from "../transactions/TransactionAmount";
import { formatDatePtBR } from "@/lib/format-date";
import { SummaryCard } from "./SummaryCard";

type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE" | "INVESTMENT";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
  categoryId?: string | null;
  isRecurring?: boolean;
};

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";

export type TransactionFilters = {
  search: string;
  categoryFilter: string;
  paymentFilter: string;
  dateFrom: string;
  amountMin: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  BOLETO: "Boleto",
  ACCOUNT_DEBIT: "Déb. Conta",
};

function fmtCurrency(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(date: Date | string) {
  const iso = typeof date === "string" ? date : date.toISOString();
  return formatDatePtBR(iso);
}

function toMs(date: Date | string) {
  return new Date(date).getTime();
}


function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1" />
    : <ArrowDown className="w-3 h-3 ml-1" />;
}

export function TransactionTable({
  transactions,
  people,
  categories = [],
  filters,
  onEdit,
}: {
  transactions: Transaction[];
  people: Person[];
  categories?: Category[];
  filters?: TransactionFilters;
  onEdit?: (t: Transaction) => void;
}) {
  const router = useRouter();
  const byPersonId = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const byCategoryId = Object.fromEntries(
    categories.map((c) => {
      const displayName = c.parentId
        ? (categories.find((p) => p.id === c.parentId)?.name ?? c.name)
        : c.name;
      return [c.id, displayName];
    }),
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleDelete(id: string, isRecurring?: boolean) {
    setDeletingId(id);
    const url = isRecurring ? `/api/recurring-transactions/${id}` : `/api/expenses/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success(isRecurring ? "Recorrente removido." : "Transação excluída.");
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses =
    transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const usedParentCategoryIds = useMemo(() => {
    const seen = new Set<string>();
    for (const t of transactions) {
      if (!t.categoryId) continue;
      const cat = categories.find((c) => c.id === t.categoryId);
      if (!cat) continue;
      seen.add(cat.parentId ?? cat.id);
    }
    return Array.from(seen);
  }, [transactions, categories]);

  const showCategoryCol = usedParentCategoryIds.length > 0;

  const filtered = useMemo(() => {
    setPage(0);
    if (!filters) return transactions;

    const { search, categoryFilter, paymentFilter, dateFrom, amountMin } = filters;
    const minAmt = amountMin !== "" ? parseFloat(amountMin) : null;
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;

    return transactions.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter) {
        const cat = t.categoryId ? categories.find((c) => c.id === t.categoryId) : null;
        const parentId = cat ? (cat.parentId ?? cat.id) : null;
        if (parentId !== categoryFilter) return false;
      }
      if (paymentFilter && t.paymentMethod !== paymentFilter) return false;
      const tMs = toMs(t.date);
      if (fromMs !== null && tMs < fromMs) return false;
      if (minAmt !== null && t.amount < minAmt) return false;
      return true;
    });
  }, [transactions, filters, categories]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "date") {
      arr.sort((a, b) => {
        const diff = toMs(a.date) - toMs(b.date);
        return sortDir === "asc" ? diff : -diff;
      });
    } else if (sortKey === "amount") {
      arr.sort((a, b) => {
        const diff = a.amount - b.amount;
        return sortDir === "asc" ? diff : -diff;
      });
    } else {
      arr.sort((a, b) => toMs(a.date) - toMs(b.date));
    }
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Receipt className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma transação neste mês</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setSummaryOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${summaryOpen ? "" : "-rotate-90"}`}
        />
        {summaryOpen ? "Ocultar resumo" : "Ver resumo"}
      </button>
      {summaryOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={TrendingDown}
            label="Despesas"
            value={`-${fmtCurrency(totalExpenses)}`}
            colorClass="text-red-600"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Receitas"
            value={totalIncome > 0 ? `+${fmtCurrency(totalIncome)}` : fmtCurrency(0)}
            colorClass="text-green-600"
          />
          <SummaryCard
            icon={Wallet}
            label="Saldo"
            value={`${balance >= 0 ? "+" : "-"}${fmtCurrency(Math.abs(balance))}`}
            colorClass={balance >= 0 ? "text-green-700" : "text-red-700"}
          />
          <SummaryCard
            icon={Hash}
            label="Lançamentos"
            value={String(transactions.length)}
            colorClass="text-muted-foreground"
          />
        </div>
      )}

      {/* Table */}
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
                <TableRow key={t.id} className="group">
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {fmtDate(t.date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {byPersonId[t.personId] ?? t.personId}
                  </TableCell>
                  <TableCell className="text-sm">{t.description || "—"}</TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-1">
        <PageSizeSelector
          value={pageSize}
          onChange={(size) => { setPageSize(size); setPage(0); }}
        />
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
