"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Select } from "@/components/ui/select";
import { RowField } from "./RowField";
import { countPatch, installmentPatch, type PurchaseRow, totalPatch } from "./types";

type Props = {
  row: PurchaseRow;
  locked: boolean;
  onChange: (patch: Partial<PurchaseRow>) => void;
};

const COUNTS = Array.from({ length: 12 }, (_, i) => String(i + 1));

/**
 * Parcelas, Valor total and Valor da parcela as three cells of the row grid. The two amounts are
 * one figure seen two ways: typing either one recomputes the other from the count.
 */
export function PurchaseAmountFields({ row, locked, onChange }: Props) {
  const single = parseInt(row.numberOfInstallments, 10) <= 1;

  return (
    <>
      <RowField label="Parcelas">
        <Select
          aria-label="Número de parcelas"
          value={row.numberOfInstallments}
          onChange={(e) => onChange(countPatch(row, e.target.value))}
          disabled={locked}
        >
          {COUNTS.map((n) => (
            <option key={n} value={n}>
              {n}x
            </option>
          ))}
        </Select>
      </RowField>

      <RowField label={single ? "Valor" : "Valor total"}>
        <CurrencyInput
          aria-label={single ? "Valor" : "Valor total"}
          value={row.amount}
          onChange={(v) => onChange(totalPatch(row, v))}
          placeholder={single ? "Valor" : "Valor total"}
          disabled={locked}
          className="font-semibold tracking-tight tabular-nums"
        />
      </RowField>

      <RowField label="Valor da parcela">
        {single ? (
          <span className="flex h-9 items-center text-sm text-muted-foreground">à vista</span>
        ) : (
          <CurrencyInput
            aria-label="Valor da parcela"
            value={row.installmentAmount}
            onChange={(v) => onChange(installmentPatch(row, v))}
            placeholder="Valor da parcela"
            disabled={locked}
            className="font-semibold tracking-tight tabular-nums"
          />
        )}
      </RowField>
    </>
  );
}
