"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

type Props = {
  card?: CreditCard;
  onSaved: () => void;
  onCancel: () => void;
};

export function CreditCardForm({ card, onSaved, onCancel }: Props) {
  const [name, setName] = useState(card?.name ?? "");
  const [closureType, setClosureType] = useState<"FIXED" | "VARIABLE">(card?.closureType ?? "FIXED");
  const [fixedClosureDay, setFixedClosureDay] = useState(String(card?.fixedClosureDay ?? ""));
  const [dueDayOfMonth, setDueDayOfMonth] = useState(String(card?.dueDayOfMonth ?? ""));
  const [alwaysNextMonth, setAlwaysNextMonth] = useState(card?.alwaysNextMonth ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = card ? `/api/credit-cards/${card.id}` : "/api/credit-cards";
    const method = card ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        closureType,
        fixedClosureDay: closureType === "FIXED" ? parseInt(fixedClosureDay, 10) : null,
        dueDayOfMonth: parseInt(dueDayOfMonth, 10),
        alwaysNextMonth,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save card.");
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-name">Card Name</Label>
        <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nubank" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-closure-type">Closure Type</Label>
        <Select id="cc-closure-type" value={closureType} onChange={(e) => setClosureType(e.target.value as "FIXED" | "VARIABLE")} required>
          <option value="FIXED">Fixed (same day every month)</option>
          <option value="VARIABLE">Variable (set per month)</option>
        </Select>
      </div>
      {closureType === "FIXED" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc-closure-day">Closure Day</Label>
          <Input id="cc-closure-day" type="number" min="1" max="31" value={fixedClosureDay} onChange={(e) => setFixedClosureDay(e.target.value)} required />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-due-day">Due Day of Month</Label>
        <Input id="cc-due-day" type="number" min="1" max="31" value={dueDayOfMonth} onChange={(e) => setDueDayOfMonth(e.target.value)} required />
      </div>
      <div className="flex items-center gap-2">
        <input id="cc-always-next" type="checkbox" checked={alwaysNextMonth} onChange={(e) => setAlwaysNextMonth(e.target.checked)} />
        <Label htmlFor="cc-always-next">First installment always goes to next month</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : card ? "Update" : "Add Card"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
