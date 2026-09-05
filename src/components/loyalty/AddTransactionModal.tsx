"use client";

import { useEffect, useState } from "react";
import { DuplicateWarning } from "@/components/transactions/DuplicateWarning";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { findDuplicateLoyaltyTransaction } from "@/domain/services/isDuplicateLoyaltyTransaction";
import { TRANSACTION_TYPES, type Transaction } from "./loyaltyFormat";

export function AddTransactionModal({
  programId,
  defaultPersonId = "",
  existingTransactions,
  onClose,
  onSuccess,
}: {
  programId: string;
  defaultPersonId?: string;
  existingTransactions: Transaction[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("EARN");
  const [points, setPoints] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [costBrl, setCostBrl] = useState("");
  const [valueBrl, _setValueBrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [personId, setPersonId] = useState(defaultPersonId);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const duplicateMatch = findDuplicateLoyaltyTransaction(
    existingTransactions,
    type,
    points ? Number(points) : null,
    personId || null,
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
    <Dialog open onClose={onClose} title="Nova Transação" className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-tx-type" className="text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <select
              id="new-tx-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-tx-points" className="text-xs font-medium text-muted-foreground">
              Pontos
            </label>
            <input
              id="new-tx-points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              min="1"
              className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div
          className={`grid gap-3 ${type !== "REDEEM" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Data</span>
            <DatePicker value={date} onChange={setDate} required ariaLabel="Data" />
          </div>
          {type !== "REDEEM" && (
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
        {type === "PURCHASE" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="new-tx-cost" className="text-xs font-medium text-muted-foreground">
              Custo (R$)
            </label>
            <input
              id="new-tx-cost"
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
            <label htmlFor="new-tx-person" className="text-xs font-medium text-muted-foreground">
              Pessoa
            </label>
            <select
              id="new-tx-person"
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
          <label htmlFor="new-tx-description" className="text-xs font-medium text-muted-foreground">
            Descrição
          </label>
          <input
            id="new-tx-description"
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
