"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { MoreHorizontal, CreditCard, Wallet, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
  purchaseDescription?: string;
  personId?: string;
  creditCardId?: string | null;
  numberOfInstallments?: number;
};

type Person = { id: string; name: string };
type CreditCardItem = { id: string; name: string };

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  if (inst.isCanceled) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Cancelado
      </span>
    );
  }
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
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const byPersonId = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.name])), [people]);
  const byCardId = useMemo(() => Object.fromEntries(creditCards.map((c) => [c.id, c.name])), [creditCards]);

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

  const active = installments.filter((i) => !i.isCanceled);
  const total = active.reduce((s, i) => s + i.amount, 0);
  const paid = active.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = total - paid;
  const pendingCount = active.filter((i) => !i.isPaid).length;

  const filtered = useMemo(() => {
    setPage(0);
    return installments.filter((i) => {
      if (statusFilter === "paid") return i.isPaid && !i.isCanceled;
      if (statusFilter === "pending") return !i.isPaid && !i.isCanceled;
      if (statusFilter === "canceled") return i.isCanceled;
      return true;
    });
  }, [installments, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Wallet} label="Total" value={fmt(total)} colorClass="text-foreground" />
        <SummaryCard icon={CheckCircle2} label="Pago" value={fmt(paid)} colorClass="text-green-600" />
        <SummaryCard icon={CreditCard} label="Restante" value={fmt(remaining)} colorClass="text-amber-600" />
        <SummaryCard icon={Clock} label="Pendentes" value={String(pendingCount)} colorClass="text-muted-foreground" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 w-40 text-sm"
        >
          <option value="">Todos status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="canceled">Cancelado</option>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Compra</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
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

                const actions = [];
                if (onEditInstallment) {
                  actions.push({ label: "Editar parcela", onClick: () => onEditInstallment(inst) });
                }
                if (onEditPurchase) {
                  actions.push({ label: "Editar compra", onClick: () => onEditPurchase(inst) });
                }
                if (!inst.isPaid && !inst.isCanceled) {
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
                      <p className="text-xs text-muted-foreground mt-0.5">{metaParts.join(" · ")}</p>
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
