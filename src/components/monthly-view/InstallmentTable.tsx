"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { MoreHorizontal, CreditCard, Wallet, CheckCircle2, Clock, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { formatDatePtBR } from "@/lib/format-date";

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  purchaseDescription?: string;
  personId?: string;
  creditCardId?: string | null;
  numberOfInstallments?: number;
  purchaseDate?: string | Date;
};

type Person = { id: string; name: string };
type CreditCardItem = { id: string; name: string };

type SortKey = "description" | "date" | "amount";
type SortDir = "asc" | "desc";

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toDateMs(date: string | Date | undefined): number {
  if (!date) return 0;
  return new Date(date).getTime();
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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1" />
    : <ArrowDown className="w-3 h-3 ml-1" />;
}

export function InstallmentTable({
  installments,
  people = [],
  creditCards = [],
  onEditInstallment,
  onEditPurchase,
}: {
  installments: Installment[];
  people?: Person[];
  creditCards?: CreditCardItem[];
  onEditInstallment?: (inst: Installment) => void;
  onEditPurchase?: (inst: Installment) => void;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const byPersonId = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.name])), [people]);
  const byCardId = useMemo(
    () => Object.fromEntries(creditCards.map((c) => [c.id, c.name])),
    [creditCards],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  async function handleMarkPaid(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}/paid`, { method: "PATCH" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao marcar como pago.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = total - paid;
  const pendingCount = installments.filter((i) => !i.isPaid).length;

  const filtered = useMemo(() => {
    setPage(0);
    const minAmt = amountMin !== "" ? parseFloat(amountMin) : null;
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;

    return installments.filter((i) => {
      if (statusFilter === "paid") { if (!i.isPaid) return false; }
      else if (statusFilter === "pending") { if (i.isPaid) return false; }
      const dMs = toDateMs(i.purchaseDate);
      if (fromMs !== null && dMs < fromMs) return false;
      if (minAmt !== null && i.amount < minAmt) return false;
      return true;
    });
  }, [installments, statusFilter, dateFrom, amountMin]);

  const sortedInstallments = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "description") {
      arr.sort((a, b) => {
        const diff = (a.purchaseDescription ?? "").localeCompare(b.purchaseDescription ?? "");
        return sortDir === "asc" ? diff : -diff;
      });
    } else if (sortKey === "date") {
      arr.sort((a, b) => {
        const diff = toDateMs(a.purchaseDate) - toDateMs(b.purchaseDate);
        return sortDir === "asc" ? diff : -diff;
      });
    } else if (sortKey === "amount") {
      arr.sort((a, b) => {
        const diff = a.amount - b.amount;
        return sortDir === "asc" ? diff : -diff;
      });
    } else {
      arr.sort((a, b) => toDateMs(b.purchaseDate) - toDateMs(a.purchaseDate));
    }
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedInstallments.length / PAGE_SIZE);
  const paginated = sortedInstallments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (installments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <CreditCard className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma parcela neste mês</p>
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
          <SummaryCard icon={Wallet} label="Total" value={fmt(total)} colorClass="text-foreground" />
          <SummaryCard icon={CheckCircle2} label="Pago" value={fmt(paid)} colorClass="text-green-600" />
          <SummaryCard icon={CreditCard} label="Restante" value={fmt(remaining)} colorClass="text-amber-600" />
          <SummaryCard icon={Clock} label="Pendentes" value={String(pendingCount)} colorClass="text-muted-foreground" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 w-40 text-sm"
        >
          <option value="">Todos status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
        </Select>
        <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Data" className="h-8 w-36 text-sm" />
        <Input
          type="number"
          placeholder="Valor mín"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          className="h-8 w-28 text-sm"
          min={0}
        />
        {(statusFilter || dateFrom || amountMin) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground"
            onClick={() => { setStatusFilter(""); setDateFrom(""); setAmountMin(""); }}
          >
            Limpar filtros ×
          </Button>
        )}
      </div>

      {/* Table */}
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

                const actions = [];
                if (onEditInstallment) {
                  actions.push({ label: "Editar parcela", onClick: () => onEditInstallment(inst) });
                }
                if (onEditPurchase) {
                  actions.push({ label: "Editar compra", onClick: () => onEditPurchase(inst) });
                }
                if (!inst.isPaid) {
                  actions.push({
                    label: loadingId === inst.id ? "Salvando…" : "Marcar pago",
                    onClick: () => handleMarkPaid(inst.id),
                  });
                }
                actions.push({
                  label: loadingId === inst.id ? "Excluindo…" : "Excluir",
                  onClick: () => handleDelete(inst.id),
                  variant: "destructive" as const,
                });

                return (
                  <TableRow key={inst.id} className="group">
                    <TableCell>
                      <p className="text-sm font-medium">{description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {metaParts.join(" · ")}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateStr}
                    </TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
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
  );
}
