"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Closure = { id: string; year: number; month: number; closureDay: number };

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function ClosureManagerDialog({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [closureDay, setClosureDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/credit-cards/${cardId}/closures`);
    if (res.ok) {
      const data = await res.json();
      setClosures(data.closures);
    }
  }

  useEffect(() => { load(); }, [cardId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/credit-cards/${cardId}/closures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        closureDay: parseInt(closureDay, 10),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao definir fechamento.");
      return;
    }
    setClosureDay("");
    load();
  }

  return (
    <Dialog open onClose={onClose} title="Gerenciar Fechamentos">
      <div className="flex flex-col gap-5">
        {/* Existing closures */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Fechamentos Definidos</p>
          {closures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma data de fechamento definida ainda.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {closures
                .slice()
                .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">
                      {MONTH_NAMES[c.month - 1]} {c.year}
                    </span>
                    <Badge variant="secondary">Dia {c.closureDay}</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add new closing */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Definir Data de Fechamento</p>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="self-end">
              {loading ? "Salvando…" : "Salvar Fechamento"}
            </Button>
          </form>
        </div>
      </div>
    </Dialog>
  );
}

/** @deprecated Use ClosureManagerDialog instead */
export function ClosureManager({ cardId }: { cardId: string }) {
  return <ClosureManagerDialog cardId={cardId} onClose={() => {}} />;
}
