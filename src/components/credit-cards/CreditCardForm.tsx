"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

type Props = {
  card?: CreditCard;
  onSaved: () => void;
  onCancel: () => void;
};

function resolveCreditCardEndpoint(card: CreditCard | undefined): { url: string; method: string } {
  return card
    ? { url: `/api/credit-cards/${card.id}`, method: "PUT" }
    : { url: "/api/credit-cards", method: "POST" };
}

function buildCreditCardPayload(fields: {
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: string;
  fixedClosurePreviousMonth: boolean;
  dueDayOfMonth: string;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
}) {
  return {
    name: fields.name,
    closureType: fields.closureType,
    fixedClosureDay: fields.closureType === "FIXED" ? parseInt(fields.fixedClosureDay, 10) : null,
    fixedClosurePreviousMonth:
      fields.closureType === "FIXED" ? fields.fixedClosurePreviousMonth : false,
    dueDayOfMonth: parseInt(fields.dueDayOfMonth, 10),
    alwaysNextMonth: fields.closureType === "VARIABLE" ? fields.alwaysNextMonth : false,
    closureNextMonth: fields.closureNextMonth,
  };
}

function submitButtonLabel(loading: boolean, isEdit: boolean): string {
  if (loading) return "Salvando…";
  return isEdit ? "Atualizar" : "Adicionar Cartão";
}

export function CreditCardForm({ card, onSaved, onCancel }: Props) {
  const [name, setName] = useState(card?.name ?? "");
  const [closureType, setClosureType] = useState<"FIXED" | "VARIABLE">(
    card?.closureType ?? "FIXED",
  );
  const [fixedClosureDay, setFixedClosureDay] = useState(String(card?.fixedClosureDay ?? ""));
  const [dueDayOfMonth, setDueDayOfMonth] = useState(String(card?.dueDayOfMonth ?? ""));
  const [fixedClosurePreviousMonth, setFixedClosurePreviousMonth] = useState(
    card?.fixedClosurePreviousMonth ?? false,
  );
  const [alwaysNextMonth, setAlwaysNextMonth] = useState(card?.alwaysNextMonth ?? false);
  const [closureNextMonth, setClosureNextMonth] = useState(card?.closureNextMonth ?? false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { url, method } = resolveCreditCardEndpoint(card);
    const payload = buildCreditCardPayload({
      name,
      closureType,
      fixedClosureDay,
      fixedClosurePreviousMonth,
      dueDayOfMonth,
      alwaysNextMonth,
      closureNextMonth,
    });

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao salvar cartão.");
      return;
    }

    toast.success("Cartão criado com sucesso.");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-name">Nome do Cartão</Label>
        <Input
          id="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Nubank"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-closure-type">Tipo de Fechamento</Label>
        <Select
          id="cc-closure-type"
          value={closureType}
          onChange={(e) => setClosureType(e.target.value as "FIXED" | "VARIABLE")}
          required
        >
          <option value="FIXED">Fixo (mesmo dia todo mês)</option>
          <option value="VARIABLE">Variável (definido por mês)</option>
        </Select>
      </div>
      {closureType === "FIXED" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc-closure-day">Dia de Fechamento</Label>
            <Input
              id="cc-closure-day"
              type="number"
              min="1"
              max="31"
              value={fixedClosureDay}
              onChange={(e) => setFixedClosureDay(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="cc-fixed-prev-month"
              type="checkbox"
              checked={fixedClosurePreviousMonth}
              onChange={(e) => setFixedClosurePreviousMonth(e.target.checked)}
            />
            <Label htmlFor="cc-fixed-prev-month">
              Fechamento no mês anterior ao período de cobrança
            </Label>
          </div>
        </>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cc-due-day">Dia de Vencimento</Label>
        <Input
          id="cc-due-day"
          type="number"
          min="1"
          max="31"
          value={dueDayOfMonth}
          onChange={(e) => setDueDayOfMonth(e.target.value)}
          required
        />
      </div>
      {closureType === "VARIABLE" && (
        <div className="flex items-center gap-2">
          <input
            id="cc-always-next"
            type="checkbox"
            checked={alwaysNextMonth}
            onChange={(e) => setAlwaysNextMonth(e.target.checked)}
          />
          <Label htmlFor="cc-always-next">Primeira parcela sempre vai para o mês seguinte</Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          id="cc-closure-next-month"
          type="checkbox"
          checked={closureNextMonth}
          onChange={(e) => setClosureNextMonth(e.target.checked)}
        />
        <Label htmlFor="cc-closure-next-month">Dia de fechamento é no mês seguinte à compra</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {submitButtonLabel(loading, !!card)}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
