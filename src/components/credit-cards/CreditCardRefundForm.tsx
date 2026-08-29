"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { parseCurrencyBR } from "@/lib/utils";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };
type CreditCardOption = { id: string; name: string };

type Props = {
  people: Person[];
  categories: Category[];
  creditCards: CreditCardOption[];
  defaultCreditCardId?: string;
  defaultPersonId?: string;
  onSuccess: () => void;
};

export function CreditCardRefundForm({
  people,
  categories,
  creditCards,
  defaultCreditCardId = "",
  defaultPersonId = "",
  onSuccess,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState(defaultPersonId);
  const [creditCardId, setCreditCardId] = useState(defaultCreditCardId);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/credit-card-refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        creditCardId,
        description,
        amount: parseCurrencyBR(amount),
        refundDate: date,
        categoryId: categoryId || null,
        source: "MANUAL",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao adicionar estorno.");
      return;
    }

    toast.success("Estorno adicionado com sucesso.");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-person">Pessoa</Label>
        <Select
          id="r-person"
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
        <Label htmlFor="r-card">Cartão de Crédito</Label>
        <Select
          id="r-card"
          value={creditCardId}
          onChange={(e) => setCreditCardId(e.target.value)}
          required
        >
          <option value="">Selecione o cartão</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-amount">Valor</Label>
        <CurrencyInput id="r-amount" value={amount} onChange={setAmount} required />
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
        <Label htmlFor="r-description">Descrição</Label>
        <Input
          id="r-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando…" : "Adicionar Estorno"}
      </Button>
    </form>
  );
}
