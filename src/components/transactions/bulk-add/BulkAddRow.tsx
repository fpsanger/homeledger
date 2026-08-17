"use client";

import { AlertTriangle, CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, Person } from "../types";
import type { BulkRow } from "./types";

type CreditCard = { id: string; name: string };

const ROW_TYPES = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
  { value: "installment", label: "Parcelamento" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "ACCOUNT_DEBIT", label: "Débito em conta" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
];

const INCOME_SOURCES = [
  { value: "SALARY", label: "Salário" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "RENTAL", label: "Aluguel" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "OTHER", label: "Outro" },
];

type Props = {
  row: BulkRow;
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  onChange: (patch: Partial<BulkRow>) => void;
  onRemove: () => void;
};

export function BulkAddRow({ row, people, categories, creditCards, onChange, onRemove }: Props) {
  const locked = row.status === "loading" || row.status === "success";

  return (
    <div
      data-testid="bulk-add-row"
      className="grid grid-cols-1 md:grid-cols-[130px_150px_130px_150px_170px_1fr_1fr_auto] gap-2 items-start rounded-md border border-border bg-card p-3"
    >
      <Select
        aria-label="Tipo"
        value={row.type}
        onChange={(e) => onChange({ type: e.target.value as BulkRow["type"] })}
        disabled={locked}
      >
        {ROW_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Pessoa"
        value={row.personId}
        onChange={(e) => onChange({ personId: e.target.value })}
        disabled={locked}
        required
      >
        <option value="">Pessoa</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <CurrencyInput
        value={row.amount}
        onChange={(v) => onChange({ amount: v })}
        placeholder="Valor"
      />

      <DatePicker value={row.date} onChange={(v) => onChange({ date: v })} ariaLabel="Data" />

      <CategoryCombobox
        categories={categories}
        value={row.categoryId}
        onChange={(v) => onChange({ categoryId: v })}
        disabled={locked}
      />

      {row.type === "expense" && (
        <Select
          aria-label="Forma de pagamento"
          value={row.paymentMethod}
          onChange={(e) => onChange({ paymentMethod: e.target.value })}
          disabled={locked}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      )}
      {row.type === "income" && (
        <Select
          aria-label="Fonte"
          value={row.source}
          onChange={(e) => onChange({ source: e.target.value })}
          disabled={locked}
        >
          {INCOME_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      )}
      {row.type === "installment" && (
        <div className="flex flex-col gap-1.5">
          <Select
            aria-label="Cartão de crédito"
            value={row.creditCardId}
            onChange={(e) => onChange({ creditCardId: e.target.value })}
            disabled={locked}
          >
            <option value="">Cartão</option>
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Número de parcelas"
            value={row.numberOfInstallments}
            onChange={(e) => onChange({ numberOfInstallments: e.target.value })}
            disabled={locked}
          >
            {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={String(n)}>
                {n}x
              </option>
            ))}
          </Select>
        </div>
      )}

      <Input
        aria-label="Descrição"
        value={row.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Descrição (opcional)"
        disabled={locked}
      />

      <div className="flex items-center gap-2 justify-end">
        <RowStatus row={row} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={row.status === "loading"}
          aria-label="Remover linha"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function RowStatus({ row }: { row: BulkRow }) {
  if (row.status === "loading") {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }
  if (row.status === "success") {
    return (
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        {row.isDuplicate && (
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="Possível duplicata" />
        )}
      </span>
    );
  }
  if (row.status === "error") {
    return <XCircle className="w-4 h-4 text-destructive" aria-label={row.error} />;
  }
  return null;
}
