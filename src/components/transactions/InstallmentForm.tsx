"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";

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
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      toast.error(data.error ?? "Falha ao criar compra parcelada.");
      return;
    }

    setPersonId("");
    setCreditCardId("");
    setTotalAmount("");
    setNumberOfInstallments("2");
    setPurchaseDate(today);
    setCategoryId("");
    setDescription("");
    router.refresh();
    toast.success("Parcelamento salvo com sucesso.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-person">Pessoa</Label>
        <Select id="inst-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Selecione a pessoa</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-card">Cartão de Crédito</Label>
        <Select id="inst-card" value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} required>
          <option value="">Selecione o cartão</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-total">Valor Total</Label>
        <CurrencyInput id="inst-total" value={totalAmount} onChange={(v) => { setTotalAmount(v); setNumberOfInstallments(""); }} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-count">Número de Parcelas</Label>
        <Select id="inst-count" value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} required>
          {(() => {
            const total = parseFloat(totalAmount);
            if (!total || total <= 0) {
              return <option value="">Informe o valor primeiro</option>;
            }
            return Array.from({ length: 11 }, (_, i) => i + 2).map((n) => {
              const perInstallment = (total / n).toFixed(2).replace(".", ",");
              return (
                <option key={n} value={String(n)}>
                  {n}x de R$ {perInstallment}
                </option>
              );
            });
          })()}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Data da Compra</Label>
        <DatePicker value={purchaseDate} onChange={setPurchaseDate} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-category">Categoria</Label>
        <Select id="inst-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Nenhuma</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inst-description">Descrição</Label>
        <Input id="inst-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Adicionando…" : "Adicionar Compra"}</Button>
    </form>
  );
}
