"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
];

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };

export function ExpenseForm({ people, categories }: { people: Person[]; categories: Category[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isDuplicate = useDuplicateCheck("EXPENSE", amount ? parseFloat(amount) : null, date, refreshKey);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        amount: parseFloat(amount),
        date,
        paymentMethod,
        categoryId: categoryId || null,
        description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar despesa.");
      return;
    }

    setPersonId("");
    setAmount("");
    setDate(today);
    setPaymentMethod("CASH");
    setCategoryId("");
    setDescription("");
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-person">Pessoa</Label>
        <Select id="expense-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Selecione a pessoa</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-amount">Valor</Label>
        <Input
          id="expense-amount"
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
        <Label htmlFor="expense-date">Data</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-payment">Forma de Pagamento</Label>
        <Select id="expense-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-category">Categoria</Label>
        <Select id="expense-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Nenhuma</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path || c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-description">Descrição</Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      {isDuplicate && (
        <p className="text-sm text-amber-600">
          Uma transação com o mesmo valor, data e tipo já existe neste mês. Você pode continuar mesmo assim.
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando…" : "Adicionar Despesa"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
