"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatAmountBR, parseCurrencyBR } from "@/lib/utils";

type Person = { id: string; name: string };
type CreditCard = { id: string; name: string };

type Installment = {
  id: string;
  amount: number;
  installmentNumber: number;
  numberOfInstallments?: number;
  purchaseDescription?: string;
  purchaseDate?: Date | string;
  personId?: string;
  creditCardId?: string | null;
  categoryId?: string | null;
  purchaseTotalAmount?: number;
};

type Props = {
  installment: Installment;
  people?: Person[];
  creditCards?: CreditCard[];
  onSuccess: () => void;
};

const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtCurrency(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(date: Date | string) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

export function EditInstallmentForm({ installment, people = [], creditCards = [], onSuccess }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(formatAmountBR(installment.amount));
  const [description, setDescription] = useState(installment.purchaseDescription ?? "");
  const [loading, setLoading] = useState(false);

  const byPersonId = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const byCardId = Object.fromEntries(creditCards.map((c) => [c.id, c.name]));

  const installmentLabel = installment.numberOfInstallments
    ? `Parcela ${installment.installmentNumber}/${installment.numberOfInstallments}`
    : `Parcela ${installment.installmentNumber}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/installments/${installment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseCurrencyBR(amount), description }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao salvar.");
      return;
    }

    router.refresh();
    toast.success("Parcelamento atualizado.");
    onSuccess();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Purchase details */}
      <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalhes da Compra</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {installment.purchaseDescription && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Descrição</span>
              <p className="font-medium">{installment.purchaseDescription}</p>
            </div>
          )}
          {installment.purchaseDate && (
            <div>
              <span className="text-muted-foreground">Data da compra</span>
              <p className="font-medium">{fmtDate(installment.purchaseDate)}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Parcela</span>
            <p className="font-medium">{installmentLabel}</p>
          </div>
          {installment.personId && byPersonId[installment.personId] && (
            <div>
              <span className="text-muted-foreground">Pessoa</span>
              <p className="font-medium">{byPersonId[installment.personId]}</p>
            </div>
          )}
          {installment.creditCardId && byCardId[installment.creditCardId] && (
            <div>
              <span className="text-muted-foreground">Cartão</span>
              <p className="font-medium">{byCardId[installment.creditCardId]}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Valor atual</span>
            <p className="font-medium tabular-nums">{fmtCurrency(installment.amount)}</p>
          </div>
          {installment.purchaseTotalAmount != null && (
            <div>
              <span className="text-muted-foreground">Total da compra</span>
              <p className="font-medium tabular-nums">{fmtCurrency(installment.purchaseTotalAmount)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t" />

      {/* Editable fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Editar Parcela</p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ei-amount">Valor</Label>
          <CurrencyInput id="ei-amount" value={amount} onChange={setAmount} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ei-description">Descrição</Label>
          <Input
            id="ei-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar alterações"}
        </Button>

      </form>
    </div>
  );
}
