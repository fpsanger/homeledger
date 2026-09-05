"use client";

import { ChevronDown, Hash, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { Button } from "@/components/ui/button";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { maskCurrency } from "@/lib/maskCurrency";
import { SummaryCard } from "./SummaryCard";
import { TransactionTableDesktop } from "./TransactionTableDesktop";
import { TransactionTableMobile } from "./TransactionTableMobile";
import {
  type Category,
  matchesFilters,
  type Person,
  type SortDir,
  type SortKey,
  type Transaction,
  toMs,
} from "./transactionTableFilters";

export type TransactionFilters = {
  search: string;
  categoryFilter: string;
  paymentFilter: string;
  dateFrom: string;
  amountMin: string;
};

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
  const { hidden } = usePrivacy();
  const fmtCurrency = (amount: number) =>
    maskCurrency(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), hidden);
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
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
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
    return transactions.filter((t) =>
      matchesFilters(t, categories, search, categoryFilter, paymentFilter, minAmt, fromMs),
    );
  }, [transactions, filters, categories]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "date") {
      arr.sort((a, b) => {
        const d = toMs(a.date) - toMs(b.date);
        return sortDir === "asc" ? d : -d;
      });
    } else if (sortKey === "amount") {
      arr.sort((a, b) => {
        const d = a.amount - b.amount;
        return sortDir === "asc" ? d : -d;
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

  const sharedProps = {
    paginated,
    byPersonId,
    byCategoryId,
    showCategoryCol,
    deletingId,
    handleDelete,
    onEdit,
  };

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

      <div className="hidden md:block">
        <TransactionTableDesktop
          {...sharedProps}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
        />
      </div>
      <div className="md:hidden">
        <TransactionTableMobile
          {...sharedProps}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <PageSizeSelector
          value={pageSize}
          onChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
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
