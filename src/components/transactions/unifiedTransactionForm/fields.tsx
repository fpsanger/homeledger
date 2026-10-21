import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type FormType, fromCents, type SplitRow } from "./billing";

export type { FormType };

export type Person = { id: string; name: string };
export type Category = { id: string; name: string; parentId: string | null };

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
  { value: "ACCOUNT_DEBIT", label: "Débito em conta" },
];

export const INCOME_SOURCES = [
  { value: "SALARY", label: "Salário" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "RENTAL", label: "Aluguel" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "OTHER", label: "Outro" },
];

export function PersonField({
  personId,
  setPersonId,
  people,
}: {
  personId: string;
  setPersonId: (id: string) => void;
  people: Person[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="u-person">Pessoa</Label>
      <Select id="u-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
        <option value="">Selecione a pessoa</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function AmountField({
  label,
  amount,
  onAmountChange,
}: {
  label: string;
  amount: string;
  onAmountChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="u-amount">{label}</Label>
      <CurrencyInput id="u-amount" value={amount} onChange={onAmountChange} required />
    </div>
  );
}

export function TypeToggle({
  allowedTypes,
  type,
  typeLabels,
  onSelect,
}: {
  allowedTypes: FormType[] | undefined;
  type: FormType;
  typeLabels: Record<FormType, string>;
  onSelect: (t: FormType) => void;
}) {
  const types = allowedTypes ?? (["expense", "income", "credit"] as FormType[]);
  return (
    <div className="flex rounded-lg border overflow-hidden">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          aria-pressed={type === t}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            type === t
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {typeLabels[t]}
        </button>
      ))}
    </div>
  );
}

export function SplitStatus({
  rowCount,
  remainingCents,
}: {
  rowCount: number;
  remainingCents: number;
}) {
  if (rowCount === 0) return null;
  if (rowCount < 2) {
    return <p className="text-sm text-destructive">Selecione ao menos 2 pessoas.</p>;
  }
  if (remainingCents === 0) {
    return <p className="text-sm text-muted-foreground">Valores conferem com o total.</p>;
  }
  const label = remainingCents > 0 ? "Faltam" : "acima do total:";
  const formatted = fromCents(Math.abs(remainingCents));
  return (
    <p className="text-sm text-destructive">
      {remainingCents > 0 ? `${label} R$ ${formatted}` : `R$ ${formatted} ${label}`}
    </p>
  );
}

export function SplitPeopleFields({
  people,
  splitRows,
  remainingCents,
  onAddPerson,
  onRemovePerson,
  onAmountChange,
}: {
  people: Person[];
  splitRows: SplitRow[];
  remainingCents: number;
  onAddPerson: (id: string) => void;
  onRemovePerson: (index: number) => void;
  onAmountChange: (index: number, value: string) => void;
}) {
  const availablePeople = people.filter((p) => !splitRows.some((r) => r.personId === p.id));
  const [pendingPersonId, setPendingPersonId] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          aria-label="Adicionar pessoa"
          value={pendingPersonId}
          onChange={(e) => setPendingPersonId(e.target.value)}
          disabled={availablePeople.length === 0}
          className="flex-1"
        >
          <option value="">Selecione uma pessoa</option>
          {availablePeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pendingPersonId}
          onClick={() => {
            onAddPerson(pendingPersonId);
            setPendingPersonId("");
          }}
        >
          Adicionar
        </Button>
      </div>
      {splitRows.map((row, index) => {
        const person = people.find((p) => p.id === row.personId);
        return (
          <div key={row.personId} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-sm">{person?.name}</span>
            <CurrencyInput
              aria-label={`Valor de ${person?.name ?? ""}`}
              value={row.amount}
              onChange={(v) => onAmountChange(index, v)}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemovePerson(index)}>
              Remover
            </Button>
          </div>
        );
      })}
      <SplitStatus rowCount={splitRows.length} remainingCents={remainingCents} />
    </div>
  );
}
