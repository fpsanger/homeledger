"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Closure = {
  id: string;
  year: number;
  month: number;
  closureDay: number;
  previousMonth: boolean;
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function ClosureManagerDialog({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [closureDay, setClosureDay] = useState("");
  const [previousMonth, setPreviousMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(c: Closure) {
    if (!confirm(`Remover fechamento de ${MONTH_NAMES[c.month - 1]} ${c.year}?`)) return;
    setDeletingId(c.id);
    const res = await fetch(`/api/credit-cards/${cardId}/closures`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: c.year, month: c.month }),
    });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao remover fechamento.");
      return;
    }
    load();
  }

  function startEdit(c: Closure) {
    setEditingId(c.id);
    setYear(String(c.year));
    setMonth(String(c.month));
    setClosureDay(String(c.closureDay));
    setPreviousMonth(c.previousMonth);
  }

  function cancelEdit() {
    setEditingId(null);
    setYear(String(new Date().getFullYear()));
    setMonth(String(new Date().getMonth() + 1));
    setClosureDay("");
    setPreviousMonth(false);
  }

  const load = useCallback(async () => {
    const res = await fetch(`/api/credit-cards/${cardId}/closures`);
    if (res.ok) {
      const data = await res.json();
      setClosures(data.closures);
    }
  }, [cardId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/credit-cards/${cardId}/closures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        closureDay: parseInt(closureDay, 10),
        previousMonth,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao definir fechamento.");
      return;
    }
    toast.success("Fechamento salvo com sucesso.");
    setClosureDay("");
    setPreviousMonth(false);
    setEditingId(null);
    load();
  }

  return (
    <Dialog open onClose={onClose} title="Gerenciar Fechamentos">
      <div className="flex flex-col gap-5">
        {/* Existing closures */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Fechamentos Definidos</p>
          {closures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma data de fechamento definida ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {closures
                .slice()
                .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-muted-foreground">
                      {MONTH_NAMES[c.month - 1]} {c.year}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Dia {c.closureDay}
                        {c.previousMonth ? " (mês ant.)" : ""}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        disabled={loading || deletingId === c.id}
                        aria-label="Editar fechamento"
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title="Editar fechamento"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={loading || deletingId === c.id}
                        aria-label="Remover fechamento"
                        className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                        title="Remover fechamento"
                      >
                        {deletingId === c.id ? "…" : "Remover"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add new closing */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">
            {editingId ? "Editar Fechamento" : "Definir Data de Fechamento"}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cl-year">Ano</Label>
                <Input
                  id="cl-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cl-month">Mês</Label>
                <Input
                  id="cl-month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cl-day">Dia de Fechamento</Label>
                <Input
                  id="cl-day"
                  type="number"
                  min="1"
                  max="31"
                  value={closureDay}
                  onChange={(e) => setClosureDay(e.target.value)}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={previousMonth}
                onChange={(e) => setPreviousMonth(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Fechamento no mês anterior
            </label>
            <div className="flex gap-2 self-end">
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando…" : editingId ? "Atualizar" : "Salvar Fechamento"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
