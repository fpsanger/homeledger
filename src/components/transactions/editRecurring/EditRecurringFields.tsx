"use client";

import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import { PAYMENT_LABELS } from "../../monthly-view/transactionTableFilters";
import type { Category } from "../types";
import type { MonthValue } from "./recurringMonths";

export type RecurringDraft = {
  effectiveFrom: MonthValue;
  amount: string;
  description: string;
  categoryId: string;
  paymentMethod: string;
};

export function EditRecurringFields({
  draft,
  onChange,
  categories,
  window: seriesBounds,
  effectiveFromHint,
  canReview,
  onReview,
}: {
  draft: RecurringDraft;
  onChange: (patch: Partial<RecurringDraft>) => void;
  categories: Category[];
  window: { first: MonthValue; last: MonthValue | null };
  effectiveFromHint: string;
  canReview: boolean;
  onReview: () => void;
}) {
  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="er-month">Alterar a partir de</Label>
        <MonthPicker
          id="er-month"
          value={draft.effectiveFrom}
          onChange={(value) => value && onChange({ effectiveFrom: value })}
          minValue={seriesBounds.first}
          maxValue={seriesBounds.last ?? undefined}
          ariaLabel="Alterar a partir de"
        />
        <p className="text-xs text-muted-foreground">{effectiveFromHint}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="er-amount">Novo valor mensal</Label>
        <CurrencyInput
          id="er-amount"
          value={draft.amount}
          onChange={(amount) => onChange({ amount })}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="er-description">Descrição</Label>
        <Input
          id="er-description"
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <CategoryCombobox
          categories={categories}
          value={draft.categoryId}
          onChange={(categoryId) => onChange({ categoryId })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="er-payment">Forma de pagamento</Label>
        <Select
          id="er-payment"
          value={draft.paymentMethod}
          onChange={(e) => onChange({ paymentMethod: e.target.value })}
        >
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="button" onClick={onReview} disabled={!canReview}>
          Revisar alteração
        </Button>
      </div>
    </div>
  );
}
