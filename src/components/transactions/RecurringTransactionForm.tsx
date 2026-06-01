"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { parseCurrencyBR } from "@/lib/utils";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "ACCOUNT_DEBIT", label: "Débito em conta" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
];

type Props = {
  people: Person[];
  categories: Category[];
  defaultPersonId?: string;
  onSuccess?: () => void;
};

export function RecurringTransactionForm({ people, categories, defaultPersonId = "", onSuccess }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [personId, setPersonId] = useState(defaultPersonId);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ACCOUNT_DEBIT");
  const [startDate, setStartDate] = useState(today);
  const [numberOfMonths, setNumberOfMonths] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  function computeEndDate(start: string, months: number): string {
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d.toISOString().split("T")[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const months = numberOfMonths ? parseInt(numberOfMonths, 10) : null;
    const endDate = months && months > 0 ? computeEndDate(startDate, months) : null;

    const body = {
      personId,
      type,
      amount: parseCurrencyBR(amount),
      paymentMethod,
      startDate,
      endDate,
      description: description || "",
      categoryId: categoryId || null,
      frequency: "MONTHLY",
    };

    const res = await fetch("/api/recurring-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao salvar.");
      return;
    }

    setPersonId("");
    setAmount("");
    setPaymentMethod("ACCOUNT_DEBIT");
    setStartDate(today);
    setNumberOfMonths("");
    setDescription("");
    setCategoryId("");
    router.refresh();
    toast.success("Transação recorrente salva.");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex rounded-lg border overflow-hidden">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              type === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t === "EXPENSE" ? "Despesa" : "Receita"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rt-person">Pessoa</Label>
        <Select
          id="rt-person"
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
        <Label htmlFor="rt-amount">Valor mensal</Label>
        <CurrencyInput id="rt-amount" value={amount} onChange={setAmount} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rt-payment">Forma de Pagamento</Label>
        <Select
          id="rt-payment"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Data de início</Label>
        <DatePicker value={startDate} onChange={setStartDate} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rt-months">Número de meses</Label>
        <Input
          id="rt-months"
          type="number"
          min={1}
          value={numberOfMonths}
          onChange={(e) => setNumberOfMonths(e.target.value)}
          placeholder="Ex: 12"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <CategoryCombobox categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rt-description">Descrição</Label>
        <Input
          id="rt-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Seguro do carro"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : "Adicionar recorrente"}
      </Button>
    </form>
  );
}
