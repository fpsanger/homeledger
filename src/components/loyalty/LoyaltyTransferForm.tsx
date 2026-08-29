"use client";

import { useEffect, useState } from "react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { DatePicker } from "@/components/ui/date-picker";
import { maskCurrency } from "@/lib/maskCurrency";

type Program = { id: string; name: string; type: string };

type TransferPreview = { pointsReceived: number; destinationCostPer1k: number | null };

function computeTransferPreview(
  sourceAvgCostPer1k: number | null,
  pointsSent: string,
  bonusPercent: string,
): TransferPreview {
  const sentNum = Number(pointsSent) || 0;
  const bonusNum = Number(bonusPercent) || 0;
  const pointsReceived = sentNum > 0 ? Math.round(sentNum * (1 + bonusNum / 100)) : 0;
  const estimatedCostBrl = sourceAvgCostPer1k ? (sourceAvgCostPer1k * sentNum) / 1000 : 0;
  const destinationCostPer1k =
    sentNum > 0 && pointsReceived > 0 && sourceAvgCostPer1k
      ? (estimatedCostBrl / pointsReceived) * 1000
      : null;
  return { pointsReceived, destinationCostPer1k };
}

type Props = {
  programs: Program[];
  onSuccess: () => void;
  personId?: string;
};

export function LoyaltyTransferForm({ programs, onSuccess, personId }: Props) {
  const { hidden } = usePrivacy();
  const formatBrl = (value: number) =>
    maskCurrency(value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), hidden);
  const today = new Date().toISOString().slice(0, 10);
  const [fromProgramId, setFromProgramId] = useState(programs[0]?.id ?? "");
  const [toProgramId, setToProgramId] = useState(programs[1]?.id ?? "");
  const [pointsSent, setPointsSent] = useState("");
  const [bonusPercent, setBonusPercent] = useState("0");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceAvgCostPer1k, setSourceAvgCostPer1k] = useState<number | null>(null);

  useEffect(() => {
    if (!fromProgramId) return;
    let cancelled = false;
    fetch(`/api/loyalty/programs/${fromProgramId}/report`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setSourceAvgCostPer1k(d?.summary?.avgCostPer1kPoints ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [fromProgramId]);

  const { pointsReceived, destinationCostPer1k } = computeTransferPreview(
    sourceAvgCostPer1k,
    pointsSent,
    bonusPercent,
  );

  const fromProgram = programs.find((p) => p.id === fromProgramId);
  const isAirlineSource = fromProgram?.type === "AIRLINE";
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
          personId: personId ?? null,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-from">
            De
          </label>
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
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-to">
            Para
          </label>
          <select
            id="transfer-to"
            value={toProgramId}
            onChange={(e) => setToProgramId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {destinationPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isAirlineSource && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          Programas aéreos não podem transferir pontos para outros programas.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="transfer-points">
            Pontos enviados
          </label>
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
          <label className="text-sm font-medium" htmlFor="transfer-bonus">
            Bônus (%)
          </label>
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

      <div className="rounded-md bg-muted px-4 py-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pontos recebidos</span>
          <span className="font-semibold text-base">
            {pointsReceived > 0 ? pointsReceived.toLocaleString("pt-BR") : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Custo/1k pts (destino, estimado)</span>
          <span className="font-medium">
            {destinationCostPer1k != null ? formatBrl(destinationCostPer1k) : "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Data</span>
        <DatePicker value={date} onChange={setDate} required ariaLabel="Data" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="transfer-desc">
          Descrição
        </label>
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
        disabled={loading || isAirlineSource}
        className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Registrar Transferência"}
      </button>
    </form>
  );
}
