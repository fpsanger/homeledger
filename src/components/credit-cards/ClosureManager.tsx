"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Closure = { id: string; year: number; month: number; closureDay: number };

export function ClosureManager({ cardId }: { cardId: string }) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [closureDay, setClosureDay] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    const res = await fetch(`/api/credit-cards/${cardId}/closures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: parseInt(year, 10), month: parseInt(month, 10), closureDay: parseInt(closureDay, 10) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to set closure.");
      return;
    }
    setClosureDay("");
    load();
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm">Monthly Closure Dates</h3>
      {closures.length > 0 ? (
        <ul className="text-sm flex flex-col gap-1">
          {closures.map((c) => (
            <li key={c.id}>{c.year}-{String(c.month).padStart(2, "0")}: day {c.closureDay}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No closure dates set yet.</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-year">Year</Label>
          <Input id="cl-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-month">Month</Label>
          <Input id="cl-month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-20" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cl-day">Closure Day</Label>
          <Input id="cl-day" type="number" min="1" max="31" value={closureDay} onChange={(e) => setClosureDay(e.target.value)} className="w-20" required />
        </div>
        <Button type="submit">Set</Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
