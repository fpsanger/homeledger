"use client";

import { CalendarClock, Copy, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import type { Category } from "../../transactions/types";
import { describeInstallmentSplit } from "./installmentNote";
import { PurchaseAmountFields } from "./PurchaseAmountFields";
import { RowField } from "./RowField";
import { RowError, RowStatusIcon } from "./RowStatus";
import type { PurchaseRow } from "./types";

/** Parcelas · Valor total · Valor da parcela · Data · Categoria · Descrição · ações */
export const PURCHASE_GRID = "xl:grid-cols-[84px_140px_140px_150px_1fr_1fr_auto]";
export const PURCHASE_COLUMNS = [
  "Parcelas",
  "Valor total",
  "Valor da parcela",
  "Data",
  "Categoria",
  "Descrição",
  "",
];

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
      className={`grid grid-cols-2 items-start gap-x-2 gap-y-2 px-3 py-3 transition-colors duration-100 hover:bg-muted/50 motion-reduce:transition-none ${PURCHASE_GRID}`}
    >
      <PurchaseAmountFields row={row} locked={locked} onChange={onChange} />

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

      <RowField label="Descrição" className="col-span-2 xl:col-span-1">
        <Input
          aria-label="Descrição"
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrição (opcional)"
          disabled={locked}
        />
      </RowField>

      <RowActions
        row={row}
        locked={locked}
        duplicateDisabled={disabled || row.status === "loading"}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onOverrideBillingMonth={() => onChange({ billingMonth: sectionBillingMonth })}
      />

      <RowMeta row={row} locked={locked} onChange={onChange} />
    </div>
  );
}

function RowActions({
  row,
  locked,
  duplicateDisabled,
  onRemove,
  onDuplicate,
  onOverrideBillingMonth,
}: {
  row: PurchaseRow;
  locked: boolean;
  duplicateDisabled: boolean;
  onRemove: () => void;
  onDuplicate: () => void;
  onOverrideBillingMonth: () => void;
}) {
  return (
    <div className="col-span-2 flex items-center justify-end gap-1 xl:col-span-1">
      <RowStatusIcon status={row.status} isDuplicate={row.isDuplicate} />
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

/** The line under the fields: how the purchase splits, its own bill if any, and what went wrong. */
function RowMeta({
  row,
  locked,
  onChange,
}: {
  row: PurchaseRow;
  locked: boolean;
  onChange: (patch: Partial<PurchaseRow>) => void;
}) {
  const note = describeInstallmentSplit(row.amount, row.numberOfInstallments);
  const ownBill = row.billingMonth !== undefined;
  if (!note && !ownBill && row.status !== "error") return null;

  return (
    <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs xl:col-span-full">
      {note && <span className="tabular-nums text-muted-foreground">{note}</span>}
      {ownBill && (
        <RowBillingMonth
          value={row.billingMonth ?? ""}
          onChange={(v) => onChange({ billingMonth: v })}
          onClear={() => onChange({ billingMonth: undefined })}
          locked={locked}
        />
      )}
      <RowError
        status={row.status}
        error={row.error}
        fallback="Não foi possível salvar esta compra."
      />
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
    <div className="flex items-center gap-2">
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
