"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { maskCurrency } from "@/lib/maskCurrency";
import { AddTransactionModal } from "./AddTransactionModal";
import { EditTransactionModal } from "./EditTransactionModal";
import { SortIndicator, TransactionRow } from "./LoyaltyTransactionRow";
import { formatBrl, formatPts, type Transaction } from "./loyaltyFormat";

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
  defaultPersonId?: string;
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

type SortKey = "date" | "expiresAt";
type SortDir = "asc" | "desc";

export function LoyaltyProgramDetail({ program, report, defaultPersonId = "" }: Props) {
  const router = useRouter();
  const { hidden } = usePrivacy();
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
        <SummaryCard
          label="Total Investido"
          value={maskCurrency(formatBrl(summary.totalInvested), hidden)}
        />
        <SummaryCard
          label="Custo/1k pts"
          value={
            summary.avgCostPer1kPoints > 0
              ? maskCurrency(formatBrl(summary.avgCostPer1kPoints), hidden)
              : "—"
          }
        />
        <SummaryCard
          label="Total Resgatado"
          value={maskCurrency(formatBrl(summary.totalValueRedeemed), hidden)}
        />
        <SummaryCard label="Expirados" value={formatPts(summary.totalExpired)} />
        <SummaryCard
          label="ROI Geral"
          value={
            summary.totalValueRedeemed === 0
              ? "Nenhum resgate"
              : summary.overallRoi != null
                ? `${summary.overallRoi.toFixed(1)}%`
                : "—"
          }
        />
      </div>

      {showModal && (
        <AddTransactionModal
          programId={program.id}
          defaultPersonId={defaultPersonId}
          existingTransactions={transactions}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          existingTransactions={transactions}
          onClose={() => setEditingTx(null)}
          onSuccess={() => {
            setEditingTx(null);
            router.refresh();
          }}
        />
      )}

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Transações
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Adicionar
            </button>
          </div>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma transação registrada.
          </p>
        ) : (
          <div className="hidden md:block rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Data <SortIndicator active={sortKey === "date"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pontos</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Valor do milheiro (Custo/1k PTS)
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">ROI</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSort("expiresAt")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Expiração <SortIndicator active={sortKey === "expiresAt"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Descrição
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    deletingId={deletingId}
                    onEdit={setEditingTx}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Program accent */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: program.color }} />
        <span>
          {program.name} · {program.type}
        </span>
      </div>
    </div>
  );
}
