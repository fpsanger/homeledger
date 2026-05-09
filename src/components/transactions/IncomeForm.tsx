"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const INCOME_SOURCES = [
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "RENTAL", label: "Rental" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "OTHER", label: "Other" },
];

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };

export function IncomeForm({ people, categories }: { people: Person[]; categories: Category[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [source, setSource] = useState("SALARY");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isDuplicate = useDuplicateCheck("INCOME", amount ? parseFloat(amount) : null, date, refreshKey);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        amount: parseFloat(amount),
        date,
        source,
        categoryId: categoryId || null,
        description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create income.");
      return;
    }

    setPersonId("");
    setAmount("");
    setDate(today);
    setSource("SALARY");
    setCategoryId("");
    setDescription("");
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-person">Person</Label>
        <Select id="income-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Select person</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-amount">Amount</Label>
        <Input
          id="income-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-date">Date</Label>
        <Input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-source">Source</Label>
        <Select id="income-source" value={source} onChange={(e) => setSource(e.target.value)} required>
          {INCOME_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-category">Category</Label>
        <Select id="income-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-description">Description</Label>
        <Input
          id="income-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>
      {isDuplicate && (
        <p className="text-sm text-amber-600">
          A transaction with the same amount, date, and type already exists this month. You can still proceed.
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Adding…" : "Add Income"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
