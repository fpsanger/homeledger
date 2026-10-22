"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnHeaders } from "../../credit-cards/bulk-add/RowField";
import type { Category, Person } from "../types";
import { BULK_ROW_COLUMNS, BULK_ROW_GRID, BulkAddRow } from "./BulkAddRow";
import { SectionHeader } from "./SectionHeader";
import type { Totals } from "./summary";
import type { NormalRows } from "./useNormalRows";

type Props = {
  normal: NormalRows;
  people: Person[];
  categories: Category[];
  totals: Totals;
  disabled: boolean;
};

/** PIX, dinheiro, débito, boleto… and incomes: one flat, divided list of entries. */
export function NormalSection({ normal, people, categories, totals, disabled }: Props) {
  return (
    <section aria-labelledby="bulk-normal-title" className="flex flex-col gap-3">
      <SectionHeader
        id="bulk-normal-title"
        title="Despesas e receitas"
        description="PIX, dinheiro, débito, boleto e demais formas de pagamento."
        totals={totals}
      />
      <div className="rounded-xl border border-border bg-card">
        <ColumnHeaders template={BULK_ROW_GRID} labels={BULK_ROW_COLUMNS} />
        <div className="divide-y divide-border">
          {normal.rows.map((row) => (
            <BulkAddRow
              key={row.clientId}
              row={row}
              people={people}
              categories={categories}
              disabled={disabled}
              onChange={(patch) => normal.editRow(row.clientId, patch)}
              onRemove={() => normal.removeRow(row.clientId)}
            />
          ))}
        </div>
        <div className="border-t border-border px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            onClick={normal.addRow}
            disabled={disabled}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Adicionar linha
          </Button>
        </div>
      </div>
    </section>
  );
}
