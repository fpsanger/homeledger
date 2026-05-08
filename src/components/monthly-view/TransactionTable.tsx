"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { MoreHorizontal, Receipt, TrendingDown, TrendingUp, Wallet, Hash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
  categoryId?: string | null;
};

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string; parentId: string | null };

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  BOLETO: "Boleto",
};

const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtCurrency(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(date: Date | string) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_ABBR[d.getMonth()]}`;
}

function dateKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
        {label}
      </div>
      <p className={`text-lg font-semibold tabular-nums ${colorClass}`}>{value}</p>
    </div>
  );
}

export function TransactionTable({
  transactions,
  installmentExpenses = 0,
  people,
  categories = [],
}: {
  transactions: Transaction[];
  installmentExpenses?: number;
  people: Person[];
  categories?: Category[];
}) {
  const router = useRouter();
  const byPersonId = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const byCategoryId = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
  }

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0) + installmentExpenses;
  const balance = totalIncome - totalExpenses;

  const paymentMethods = useMemo(() => {
    const seen = new Set<string>();
    for (const t of transactions) if (t.paymentMethod) seen.add(t.paymentMethod);
    return Array.from(seen);
  }, [transactions]);

  const usedCategoryIds = useMemo(() => {
    const seen = new Set<string>();
    for (const t of transactions) if (t.categoryId) seen.add(t.categoryId);
    return Array.from(seen);
  }, [transactions]);

  const showCategoryCol = usedCategoryIds.length > 0;

  const filtered = useMemo(() => {
    setPage(0);
    return transactions.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (paymentFilter && t.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [transactions, search, categoryFilter, paymentFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      {/* Summary cards */}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-sm"
        />
        {showCategoryCol && (
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 w-44 text-sm"
          >
            <option value="">Todas categorias</option>
            {usedCategoryIds.map((cid) => (
              <option key={cid} value={cid}>
                {byCategoryId[cid] ?? cid}
              </option>
            ))}
          </Select>
        )}
        {paymentMethods.length > 0 && (
          <Select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-8 w-40 text-sm"
          >
            <option value="">Todos métodos</option>
            {paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {PAYMENT_LABELS[pm] ?? pm}
              </option>
            ))}
          </Select>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-20">Data</TableHead>
              <TableHead>Pessoa</TableHead>
              <TableHead>Descrição</TableHead>
              {showCategoryCol && <TableHead>Categoria</TableHead>}
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCategoryCol ? 7 : 6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum resultado encontrado
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                let lastDateKey = "";
                return paginated.map((t) => {
                  const dk = dateKey(t.date);
                  const isNewDate = dk !== lastDateKey;
                  lastDateKey = dk;
                  return (
                    <TableRow key={t.id} className="group">
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {isNewDate ? fmtDate(t.date) : ""}
                      </TableCell>
                      <TableCell className="text-sm">{byPersonId[t.personId] ?? t.personId}</TableCell>
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
                        <span className={t.type === "EXPENSE" ? "text-red-600" : "text-green-600"}>
                          {t.type === "EXPENSE" ? "-" : "+"}{fmtCurrency(t.amount)}
                        </span>
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
                            {
                              label: deletingId === t.id ? "Excluindo..." : "Excluir",
                              onClick: () => handleDelete(t.id),
                              variant: "destructive",
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                });
              })()
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próximo →
          </Button>
        </div>
      )}
    </div>
  );
}
