"use client";

import { useEffect, useState } from "react";
import { DuplicateWarning } from "@/components/transactions/DuplicateWarning";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { findDuplicateLoyaltyTransaction } from "@/domain/services/isDuplicateLoyaltyTransaction";
import { type Transaction, TYPE_LABELS } from "./loyaltyFormat";

function computeEditFormInitialState(tx: Transaction) {
  return {
    points: String(tx.points),
    date: tx.date.slice(0, 10),
    description: tx.description ?? "",
    costBrl: tx.costBrl != null ? String(tx.costBrl) : "",
    expiresAt: tx.expiresAt ? tx.expiresAt.slice(0, 10) : "",
    personId: tx.personId ?? "",
  };
}

function resolveDuplicateCheckInputs(
  points: string,
  personId: string,
): { points: number | null; personId: string | null } {
  return {
    points: points ? Number(points) : null,
    personId: personId || null,
  };
}

export function EditTransactionModal({
  tx,
  existingTransactions,
  onClose,
  onSuccess,
}: {
  tx: Transaction;
  existingTransactions: Transaction[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initial = computeEditFormInitialState(tx);
  const [points, setPoints] = useState(initial.points);
  const [date, setDate] = useState(initial.date);
  const [description, setDescription] = useState(initial.description);
  const [costBrl, setCostBrl] = useState(initial.costBrl);
  const [expiresAt, setExpiresAt] = useState(initial.expiresAt);
  const [personId, setPersonId] = useState(initial.personId);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const duplicateCheckInputs = resolveDuplicateCheckInputs(points, personId);
  const duplicateMatch = findDuplicateLoyaltyTransaction(
    existingTransactions.filter((t) => t.id !== tx.id),
    tx.type,
    duplicateCheckInputs.points,
    duplicateCheckInputs.personId,
    date,
  );

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
      const res = await fetch(`/api/loyalty/transactions/${tx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: Number(points),
          date,
          description: description || null,
          costBrl: costBrl ? Number(costBrl) : null,
          expiresAt: expiresAt || null,
          personId: personId || null,
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
    <Dialog open onClose={onClose} title="Editar Transação" className="max-w-md">
      <p className="text-xs text-muted-foreground -mt-2 mb-3">
        Tipo: <span className="font-medium">{TYPE_LABELS[tx.type] ?? tx.type}</span>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="edit-tx-points" className="text-xs font-medium text-muted-foreground">
            Pontos
          </label>
          <input
            id="edit-tx-points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            min="1"
            className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div
          className={`grid gap-3 ${tx.type !== "REDEEM" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Data</span>
            <DatePicker value={date} onChange={setDate} required ariaLabel="Data" />
          </div>
          {tx.type !== "REDEEM" && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Expiração</span>
              <DatePicker
                value={expiresAt}
                onChange={setExpiresAt}
                endMonth={new Date(new Date().getFullYear() + 3, 11)}
                ariaLabel="Expiração"
              />
            </div>
          )}
        </div>
        {tx.type === "PURCHASE" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-tx-cost" className="text-xs font-medium text-muted-foreground">
              Custo (R$)
            </label>
            <input
              id="edit-tx-cost"
              type="number"
              step="0.01"
              value={costBrl}
              onChange={(e) => setCostBrl(e.target.value)}
              placeholder="0,00"
              className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        {people.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-tx-person" className="text-xs font-medium text-muted-foreground">
              Pessoa
            </label>
            <select
              id="edit-tx-person"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="edit-tx-description"
            className="text-xs font-medium text-muted-foreground"
          >
            Descrição
          </label>
          <input
            id="edit-tx-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <DuplicateWarning match={duplicateMatch} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
