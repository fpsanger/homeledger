"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };
type CreditCard = { id: string; name: string };

export function InstallmentForm({
  people,
  categories,
  creditCards,
}: {
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/installments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        creditCardId,
        totalAmount: parseFloat(totalAmount),
        numberOfInstallments: parseInt(numberOfInstallments, 10),
        purchaseDate,
        categoryId: categoryId || null,
        description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create installment purchase.");
      return;
    }

    setPersonId("");
    setCreditCardId("");
    setTotalAmount("");
    setNumberOfInstallments("2");
    setPurchaseDate(today);
    setCategoryId("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-person">Person</Label>
        <Select id="inst-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Select person</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-card">Credit Card</Label>
        <Select id="inst-card" value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} required>
          <option value="">Select card</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-total">Total Amount</Label>
        <Input id="inst-total" type="number" min="0.01" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-count">Number of Installments</Label>
        <Input id="inst-count" type="number" min="2" step="1" value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-date">Purchase Date</Label>
        <Input id="inst-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-category">Category</Label>
        <Select id="inst-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-description">Description</Label>
        <Input id="inst-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Adding…" : "Add Purchase"}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
