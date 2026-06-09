"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseCurrencyBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };

export function InvestmentForm({
  people,
  categories,
  defaultPersonId = "",
  onSuccess,
}: {
  people: Person[];
  categories: Category[];
  defaultPersonId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState(defaultPersonId);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        amount: parseCurrencyBR(amount),
        date,
        categoryId,
        description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao criar investimento.");
      return;
    }

    setPersonId("");
    setAmount("");
    setDate(today);
    setCategoryId("");
    setDescription("");
    router.refresh();
    toast.success("Investimento salvo com sucesso.");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inv-person">Pessoa</Label>
        <Select
          id="inv-person"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          required
        >
          <option value="">Selecione a pessoa</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inv-amount">Valor</Label>
        <CurrencyInput id="inv-amount" value={amount} onChange={setAmount} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Data</Label>
        <DatePicker value={date} onChange={setDate} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <CategoryCombobox categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inv-description">Descrição</Label>
        <Input
          id="inv-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando…" : "Adicionar Investimento"}
      </Button>
    </form>
  );
}
