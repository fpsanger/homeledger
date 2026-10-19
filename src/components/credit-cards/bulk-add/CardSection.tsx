"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import type { Category, Person } from "../../transactions/types";
import { PurchaseRowForm } from "./PurchaseRowForm";
import type { ClosureType, PurchaseRow } from "./types";

type CreditCard = { id: string; name: string; closureType: ClosureType };

type Props = {
  card: CreditCard;
  rows: PurchaseRow[];
  billingMonth: string;
  onBillingMonthChange: (value: string) => void;
  categories: Category[];
  people: Person[];
  personId: string;
  onPersonChange: (id: string) => void;
  onAddRow: () => void;
  onEditRow: (rowId: string, patch: Partial<PurchaseRow>) => void;
  onRemoveRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onRemoveSection: () => void;
  disabled?: boolean;
};

export function CardSection({
  card,
  rows,
  billingMonth,
  onBillingMonthChange,
  categories,
  people,
  personId,
  onPersonChange,
  onAddRow,
  onEditRow,
  onRemoveRow,
  onDuplicateRow,
  onRemoveSection,
  disabled = false,
}: Props) {
  const sectionLocked =
    disabled || rows.some((r) => r.status === "loading" || r.status === "success");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{card.name}</span>
        <button
          type="button"
          aria-label={`Remover cartão ${card.name}`}
          onClick={onRemoveSection}
          disabled={sectionLocked}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Pessoa"
          value={personId}
          onChange={(e) => onPersonChange(e.target.value)}
          disabled={disabled}
          className="max-w-xs"
        >
          <option value="">Pessoa</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <SectionBillingMonth
          closureType={card.closureType}
          value={billingMonth}
          onChange={onBillingMonthChange}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <PurchaseRowForm
            key={row.rowId}
            row={row}
            sectionBillingMonth={billingMonth}
            categories={categories}
            onChange={(patch) => onEditRow(row.rowId, patch)}
            onRemove={() => onRemoveRow(row.rowId)}
            onDuplicate={() => onDuplicateRow(row.rowId)}
            disabled={disabled}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAddRow}
        disabled={disabled}
        className="self-start gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Adicionar compra
      </Button>
    </div>
  );
}

function SectionBillingMonth({
  closureType,
  value,
  onChange,
  disabled,
}: {
  closureType: ClosureType;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Fatura</span>
      <MonthPicker
        ariaLabel="Fatura das compras"
        value={value}
        onChange={onChange}
        placeholder="Automática"
        clearLabel={closureType === "FIXED" ? "Automática pelo fechamento" : undefined}
        disabled={disabled}
        className="w-40"
      />
      {closureType === "FIXED" && !value && (
        <span className="text-xs text-muted-foreground">calculada pela data de fechamento</span>
      )}
    </div>
  );
}
