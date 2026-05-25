"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";

type Program = { id: string; name: string };

type Props = {
  programs: Program[];
  onSuccess: () => void;
};

export function LoyaltyTransferForm({ programs, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [fromProgramId, setFromProgramId] = useState(programs[0]?.id ?? "");
  const [toProgramId, setToProgramId] = useState(programs[1]?.id ?? "");
  const [pointsSent, setPointsSent] = useState("");
  const [bonusPercent, setBonusPercent] = useState("0");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sentNum = Number(pointsSent) || 0;
  const bonusNum = Number(bonusPercent) || 0;
  const pointsReceived = sentNum > 0 ? Math.round(sentNum * (1 + bonusNum / 100)) : 0;

  const destinationPrograms = programs.filter((p) => p.id !== fromProgramId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fromProgramId === toProgramId) {
      setError("Programa de origem e destino devem ser diferentes.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromProgramId,
          toProgramId,
          pointsSent: Number(pointsSent),
          pointsReceived,
          transferDate: date,
          description: description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao registrar transferência.");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-from">De</label>
          <select
            id="transfer-from"
            value={fromProgramId}
            onChange={(e) => {
              setFromProgramId(e.target.value);
              if (toProgramId === e.target.value) {
                const other = programs.find((p) => p.id !== e.target.value);
                setToProgramId(other?.id ?? "");
              }
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-to">Para</label>
          <select
            id="transfer-to"
            value={toProgramId}
            onChange={(e) => setToProgramId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {destinationPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-points">Pontos enviados</label>
          <input
            id="transfer-points"
            type="number"
            min="1"
            value={pointsSent}
            onChange={(e) => setPointsSent(e.target.value)}
            required
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-bonus">Bônus (%)</label>
          <input
            id="transfer-bonus"
            type="number"
            min="0"
            step="1"
            value={bonusPercent}
            onChange={(e) => setBonusPercent(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-md bg-muted px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pontos recebidos</span>
        <span className="font-semibold text-base">{pointsReceived > 0 ? pointsReceived.toLocaleString("pt-BR") : "—"}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Data</label>
        <DatePicker value={date} onChange={setDate} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="transfer-desc">Descrição</label>
        <input
          id="transfer-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Registrar Transferência"}
      </button>
    </form>
  );
}
