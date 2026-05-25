"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type FifoData = {
  costBrl: number;
  costPer1kPoints: number;
  roi: number | null;
};

type Transaction = {
  id: string;
  type: string;
  points: number;
  date: string;
  description: string | null;
  expiresAt: string | null;
  costBrl: number | null;
  valueBrl: number | null;
  transferId: string | null;
  fifoData?: FifoData;
};

type Summary = {
  currentBalance: number;
  totalInvested: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
};

type Program = {
  id: string;
  name: string;
  type: string;
  color: string;
};

type Props = {
  program: Program;
  report: {
    summary: Summary;
    transactions: Transaction[];
  };
};

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Compra",
  EARN: "Acúmulo",
  BONUS: "Bônus",
  REDEEM: "Resgate",
  TRANSFER_OUT: "Transferência Saída",
  TRANSFER_IN: "Transferência Entrada",
  EXPIRE: "Expiração",
  ADJUSTMENT: "Ajuste",
};

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: "text-blue-600 dark:text-blue-400",
  EARN: "text-green-600 dark:text-green-400",
  BONUS: "text-emerald-600 dark:text-emerald-400",
  REDEEM: "text-orange-600 dark:text-orange-400",
  TRANSFER_OUT: "text-red-500 dark:text-red-400",
  TRANSFER_IN: "text-indigo-600 dark:text-indigo-400",
  EXPIRE: "text-rose-600 dark:text-rose-400",
  ADJUSTMENT: "text-muted-foreground",
};

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPts(value: number) {
  return `${value.toLocaleString("pt-BR")} pts`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function pointsSign(type: string, points: number) {
  const negative = ["REDEEM", "TRANSFER_OUT", "EXPIRE"].includes(type) || (type === "ADJUSTMENT" && points < 0);
  return negative ? `-${Math.abs(points).toLocaleString("pt-BR")}` : `+${points.toLocaleString("pt-BR")}`;
}

const TRANSACTION_TYPES = [
  { value: "PURCHASE", label: "Compra" },
  { value: "EARN", label: "Acúmulo" },
  { value: "BONUS", label: "Bônus" },
  { value: "REDEEM", label: "Resgate" },
  { value: "EXPIRE", label: "Expiração" },
  { value: "ADJUSTMENT", label: "Ajuste" },
];

function AddTransactionModal({ programId, onClose, onSuccess }: { programId: string; onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("EARN");
  const [points, setPoints] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [costBrl, setCostBrl] = useState("");
  const [valueBrl, setValueBrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [personId, setPersonId] = useState("");
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((d) => setPeople(d.people ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          type,
          points: Number(points),
          date,
          description: description || null,
          costBrl: costBrl ? Number(costBrl) : null,
          valueBrl: valueBrl ? Number(valueBrl) : null,
          expiresAt: expiresAt || null,
          personId: personId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao criar transação.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-xl border shadow-lg p-6 w-full max-w-md flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold">Nova Transação</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Pontos</label>
              <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} required min="1" className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className={`grid gap-3 ${type !== "REDEEM" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <DatePicker value={date} onChange={setDate} required />
            </div>
            {type !== "REDEEM" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Expiração</label>
                <DatePicker value={expiresAt} onChange={setExpiresAt} endMonth={new Date(new Date().getFullYear() + 3, 11)} />
              </div>
            )}
          </div>
          {type === "PURCHASE" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Custo (R$)</label>
              <input type="number" step="0.01" value={costBrl} onChange={(e) => setCostBrl(e.target.value)} placeholder="0,00" className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          {people.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Pessoa</label>
              <select value={personId} onChange={(e) => setPersonId(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Todos</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTransactionModal({ tx, onClose, onSuccess }: { tx: Transaction; onClose: () => void; onSuccess: () => void }) {
  const [points, setPoints] = useState(String(tx.points));
  const [date, setDate] = useState(tx.date.slice(0, 10));
  const [description, setDescription] = useState(tx.description ?? "");
  const [costBrl, setCostBrl] = useState(tx.costBrl != null ? String(tx.costBrl) : "");
  const [expiresAt, setExpiresAt] = useState(tx.expiresAt ? tx.expiresAt.slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/transactions/${tx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: Number(points),
          date,
          description: description || null,
          costBrl: costBrl ? Number(costBrl) : null,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao atualizar transação.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-xl border shadow-lg p-6 w-full max-w-md flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold">Editar Transação</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Tipo: <span className="font-medium">{TYPE_LABELS[tx.type] ?? tx.type}</span>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Pontos</label>
            <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} required min="1" className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className={`grid gap-3 ${tx.type !== "REDEEM" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <DatePicker value={date} onChange={setDate} required />
            </div>
            {tx.type !== "REDEEM" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Expiração</label>
                <DatePicker value={expiresAt} onChange={setExpiresAt} endMonth={new Date(new Date().getFullYear() + 3, 11)} />
              </div>
            )}
          </div>
          {tx.type === "PURCHASE" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Custo (R$)</label>
              <input type="number" step="0.01" value={costBrl} onChange={(e) => setCostBrl(e.target.value)} placeholder="0,00" className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SortKey = "date" | "expiresAt";
type SortDir = "asc" | "desc";

const EDITABLE_TYPES = ["PURCHASE", "EARN", "BONUS", "REDEEM", "EXPIRE", "ADJUSTMENT"];

export function LoyaltyProgramDetail({ program, report }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { summary, transactions } = report;

  async function handleDelete(tx: Transaction) {
    setDeletingId(tx.id);
    const isTransfer = tx.type === "TRANSFER_IN" || tx.type === "TRANSFER_OUT";
    const url = isTransfer
      ? `/api/loyalty/transfers/${tx.transferId}`
      : `/api/loyalty/transactions/${tx.id}`;
    const res = await fetch(url, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success(isTransfer ? "Transferência excluída." : "Transação excluída.");
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...transactions].sort((a, b) => {
    const aVal = sortKey === "expiresAt" ? (a.expiresAt ?? "") : a.date;
    const bVal = sortKey === "expiresAt" ? (b.expiresAt ?? "") : b.date;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Saldo" value={formatPts(summary.currentBalance)} />
        <SummaryCard label="Total Investido" value={formatBrl(summary.totalInvested)} />
        <SummaryCard label="Custo/1k pts" value={summary.avgCostPer1kPoints > 0 ? formatBrl(summary.avgCostPer1kPoints) : "—"} />
        <SummaryCard label="Total Resgatado" value={formatBrl(summary.totalValueRedeemed)} />
        <SummaryCard label="Expirados" value={formatPts(summary.totalExpired)} />
        <SummaryCard
          label="ROI Geral"
          value={summary.overallRoi != null ? `${summary.overallRoi.toFixed(1)}%` : "—"}
        />
      </div>

      {showModal && (
        <AddTransactionModal
          programId={program.id}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); router.refresh(); }}
        />
      )}
      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          onClose={() => setEditingTx(null)}
          onSuccess={() => { setEditingTx(null); router.refresh(); }}
        />
      )}

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Transações
          </h2>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Adicionar
          </button>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma transação registrada.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button type="button" onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Data {sortKey === "date" ? (sortDir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pontos</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor do milheiro (Custo/1k PTS)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">ROI</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button type="button" onClick={() => handleSort("expiresAt")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Expiração {sortKey === "expiresAt" ? (sortDir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${TYPE_COLORS[tx.type] ?? ""}`}>
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {pointsSign(tx.type, tx.points)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {tx.fifoData && Number.isFinite(tx.fifoData.costPer1kPoints)
                        ? formatBrl(tx.fifoData.costPer1kPoints)
                        : tx.type === "PURCHASE" && tx.costBrl && tx.points > 0
                          ? formatBrl((tx.costBrl / tx.points) * 1000)
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.fifoData?.roi != null && Number.isFinite(tx.fifoData.roi) ? (
                        <span className={tx.fifoData.roi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                          {tx.fifoData.roi.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {tx.expiresAt ? formatDate(tx.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {tx.description ?? ""}
                      {tx.costBrl && tx.type === "PURCHASE" ? ` · ${formatBrl(tx.costBrl)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        align="right"
                        trigger={
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            aria-label="Ações"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          ...(EDITABLE_TYPES.includes(tx.type)
                            ? [{ label: "Editar", onClick: () => setEditingTx(tx) }]
                            : []),
                          {
                            label: deletingId === tx.id ? "Excluindo..." : "Excluir",
                            onClick: () => handleDelete(tx),
                            variant: "destructive" as const,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Program accent */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: program.color }} />
        <span>{program.name} · {program.type}</span>
      </div>
    </div>
  );
}
