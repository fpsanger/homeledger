"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import type { Category, Person } from "../../transactions/types";
import { PURCHASE_COLUMNS, PURCHASE_GRID, PurchaseRowForm } from "./PurchaseRowForm";
import { ColumnHeaders } from "./RowField";
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

/** One card's purchases: a header with who and which bill, then flat rows, then add. */
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
    <section
      aria-label={`Compras no ${card.name}`}
      className="rounded-xl border border-border bg-card"
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-t-xl border-b border-border bg-secondary/40 px-3 py-2">
        <h3 className="order-1 flex-1 text-sm font-semibold tracking-tight sm:order-none sm:flex-none">
          {card.name}
        </h3>
        <Select
          aria-label="Pessoa"
          value={personId}
          onChange={(e) => onPersonChange(e.target.value)}
          disabled={disabled}
          className="order-3 w-full sm:order-none sm:w-44"
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remover cartão ${card.name}`}
          title="Remover este cartão e suas compras"
          onClick={onRemoveSection}
          disabled={sectionLocked}
          className="order-2 ml-auto sm:order-none"
        >
          <X className="w-4 h-4" />
        </Button>
      </header>

      <ColumnHeaders template={PURCHASE_GRID} labels={PURCHASE_COLUMNS} />
      <div className="divide-y divide-border">
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

      <div className="border-t border-border px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onAddRow}
          disabled={disabled}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar compra
        </Button>
      </div>
    </section>
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
    <div className="order-4 flex items-center gap-2 text-sm sm:order-none">
      <span className="text-muted-foreground">Fatura</span>
      <MonthPicker
        ariaLabel="Fatura das compras"
        value={value}
        onChange={onChange}
        placeholder={closureType === "FIXED" ? "Automática" : "Selecione a fatura"}
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
