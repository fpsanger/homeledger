"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RowField } from "../../credit-cards/bulk-add/RowField";
import { RowError, RowStatusIcon } from "../../credit-cards/bulk-add/RowStatus";
import type { Category, Person } from "../types";
import type { BulkRow } from "./types";

const ROW_TYPES = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
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

/** Tipo · Pessoa · Valor · Data · Categoria · Forma/Fonte · Descrição · ações */
export const BULK_ROW_GRID = "xl:grid-cols-[120px_140px_140px_150px_1fr_170px_1fr_auto]";
export const BULK_ROW_COLUMNS = [
  "Tipo",
  "Pessoa",
  "Valor",
  "Data",
  "Categoria",
  "Forma de pagamento / fonte",
  "Descrição",
  "",
];

type Props = {
  row: BulkRow;
  people: Person[];
  categories: Category[];
  onChange: (patch: Partial<BulkRow>) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function BulkAddRow({
  row,
  people,
  categories,
  onChange,
  onRemove,
  disabled = false,
}: Props) {
  const locked = disabled || row.status === "loading" || row.status === "success";

  return (
    <div
      data-testid="bulk-add-row"
      className={`grid grid-cols-2 items-start gap-x-2 gap-y-2 px-3 py-3 transition-colors duration-100 hover:bg-muted/50 motion-reduce:transition-none ${BULK_ROW_GRID}`}
    >
      <RowField label="Tipo">
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
      </RowField>

      <RowField label="Pessoa">
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
      </RowField>

      <RowField label="Valor">
        <CurrencyInput
          value={row.amount}
          onChange={(v) => onChange({ amount: v })}
          placeholder="Valor"
          disabled={locked}
          className="font-semibold tracking-tight tabular-nums"
        />
      </RowField>

      <RowField label="Data">
        <DatePicker
          value={row.date}
          onChange={(v) => onChange({ date: v })}
          ariaLabel="Data"
          disabled={locked}
        />
      </RowField>

      <RowField label="Categoria" className="col-span-2 xl:col-span-1">
        <CategoryCombobox
          categories={categories}
          value={row.categoryId}
          onChange={(v) => onChange({ categoryId: v })}
          disabled={locked}
        />
      </RowField>

      <TypeSpecificField row={row} locked={locked} onChange={onChange} />

      <RowField label="Descrição" className="col-span-2 xl:col-span-1">
        <Input
          aria-label="Descrição"
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrição (opcional)"
          disabled={locked}
        />
      </RowField>

      <RowActions row={row} locked={locked} onRemove={onRemove} />
      {row.status === "error" && (
        <div className="col-span-2 xl:col-span-full">
          <RowError
            status={row.status}
            error={row.error}
            fallback="Não foi possível salvar esta linha."
          />
        </div>
      )}
    </div>
  );
}

function TypeSpecificField({
  row,
  locked,
  onChange,
}: {
  row: BulkRow;
  locked: boolean;
  onChange: (patch: Partial<BulkRow>) => void;
}) {
  const income = row.type === "income";
  const options = income ? INCOME_SOURCES : PAYMENT_METHODS;

  return (
    <RowField label={income ? "Fonte" : "Forma de pagamento"} className="col-span-2 xl:col-span-1">
      <Select
        aria-label={income ? "Fonte" : "Forma de pagamento"}
        value={income ? row.source : row.paymentMethod}
        onChange={(e) =>
          onChange(income ? { source: e.target.value } : { paymentMethod: e.target.value })
        }
        disabled={locked}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </RowField>
  );
}

function RowActions({
  row,
  locked,
  onRemove,
}: {
  row: BulkRow;
  locked: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="col-span-2 flex items-center justify-end gap-1 xl:col-span-1">
      <RowStatusIcon status={row.status} isDuplicate={row.isDuplicate} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={locked}
        aria-label="Remover linha"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
