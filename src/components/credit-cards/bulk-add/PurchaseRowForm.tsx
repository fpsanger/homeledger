"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import type { Category } from "../../transactions/types";
import type { PurchaseRow } from "./types";

type Props = {
  row: PurchaseRow;
  sectionBillingMonth: string;
  categories: Category[];
  onChange: (patch: Partial<PurchaseRow>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  disabled?: boolean;
};

export function PurchaseRowForm({
  row,
  sectionBillingMonth,
  categories,
  onChange,
  onRemove,
  onDuplicate,
  disabled = false,
}: Props) {
  const locked = disabled || row.status === "loading" || row.status === "success";

  return (
    <div
      data-testid="purchase-row"
      className="grid grid-cols-1 gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-2 xl:grid-cols-[150px_150px_1fr_130px_1fr_auto] xl:items-start"
    >
      <CurrencyInput
        value={row.amount}
        onChange={(v) => onChange({ amount: v })}
        placeholder="Valor"
        disabled={locked}
      />

      <DatePicker
        value={row.date}
        onChange={(v) => onChange({ date: v })}
        ariaLabel="Data"
        disabled={locked}
      />

      <CategoryCombobox
        categories={categories}
        value={row.categoryId}
        onChange={(v) => onChange({ categoryId: v })}
        disabled={locked}
      />

      <Select
        aria-label="Número de parcelas"
        value={row.numberOfInstallments}
        onChange={(e) => onChange({ numberOfInstallments: e.target.value })}
        disabled={locked}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}x
          </option>
        ))}
      </Select>

      <Input
        aria-label="Descrição"
        value={row.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Descrição (opcional)"
        disabled={locked}
      />

      <RowActions
        row={row}
        locked={locked}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onOverrideBillingMonth={() => onChange({ billingMonth: sectionBillingMonth })}
        duplicateDisabled={disabled || row.status === "loading"}
      />

      {row.billingMonth !== undefined && (
        <RowBillingMonth
          value={row.billingMonth}
          onChange={(v) => onChange({ billingMonth: v })}
          onClear={() => onChange({ billingMonth: undefined })}
          locked={locked}
        />
      )}
    </div>
  );
}

function RowActions({
  row,
  locked,
  onRemove,
  onDuplicate,
  onOverrideBillingMonth,
  duplicateDisabled,
}: {
  row: PurchaseRow;
  locked: boolean;
  onRemove: () => void;
  onDuplicate: () => void;
  onOverrideBillingMonth: () => void;
  duplicateDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 sm:col-span-2 xl:col-span-1">
      <RowStatus row={row} />
      {row.billingMonth === undefined && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOverrideBillingMonth}
          disabled={locked}
          aria-label="Outra fatura"
          title="Lançar esta compra em outra fatura"
        >
          <CalendarClock className="w-4 h-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDuplicate}
        disabled={duplicateDisabled}
        aria-label="Copiar compra"
        title="Copiar categoria, parcelas e descrição para uma nova compra"
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={locked}
        aria-label="Remover compra"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function RowBillingMonth({
  value,
  onChange,
  onClear,
  locked,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  locked: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm sm:col-span-2 xl:col-span-6">
      <span className="text-muted-foreground">Fatura desta compra</span>
      <MonthPicker
        ariaLabel="Fatura desta compra"
        value={value}
        onChange={onChange}
        disabled={locked}
        className="w-40"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClear}
        disabled={locked}
        aria-label="Usar fatura do cartão"
        title="Usar a fatura definida para o cartão"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

function RowStatus({ row }: { row: PurchaseRow }) {
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
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
        <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{row.error ?? "Não foi possível salvar esta compra."}</span>
      </span>
    );
  }
  return null;
}
