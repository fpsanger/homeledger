"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { parseCurrencyBR } from "@/lib/utils";
import type { Category, Person } from "../types";
import { buildFieldDiffs, buildPeriods, buildSummary } from "./changeSummary";
import { EditRecurringFields, type RecurringDraft } from "./EditRecurringFields";
import { RecurringChangeReview } from "./RecurringChangeReview";
import { RecurringSeriesHeader } from "./RecurringSeriesHeader";
import { formatMonth, formatMonthRange, type MonthValue, seriesWindow } from "./recurringMonths";
import type { RecurringRule } from "./useRecurringRule";

function hasChanges(draft: RecurringDraft, rule: RecurringRule): boolean {
  const amount = parseCurrencyBR(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return false;
  return (
    amount !== rule.amount ||
    draft.description !== rule.description ||
    draft.categoryId !== (rule.categoryId ?? "") ||
    draft.paymentMethod !== rule.paymentMethod
  );
}

function effectiveFromHint(draft: RecurringDraft, first: MonthValue): string {
  if (draft.effectiveFrom === first) return "Toda a recorrência será atualizada.";
  return `Meses antes de ${formatMonth(draft.effectiveFrom)} mantêm o valor atual.`;
}

/**
 * The dialog's contents once the rule has loaded. Split from `EditRecurringDialog` so the
 * loaded state is typed non-null here instead of being re-checked at every use.
 */
export function EditRecurringBody({
  rule,
  draft,
  patchDraft,
  step,
  setStep,
  people,
  categories,
  onClose,
}: {
  rule: RecurringRule;
  draft: RecurringDraft;
  patchDraft: (patch: Partial<RecurringDraft>) => void;
  step: "edit" | "review";
  setStep: (step: "edit" | "review") => void;
  people: Person[];
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const bounds = seriesWindow(rule);

  async function handleConfirm() {
    setSaving(true);
    const res = await fetch(`/api/recurring-transactions/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effectiveFrom: draft.effectiveFrom,
        amount: parseCurrencyBR(draft.amount),
        description: draft.description,
        categoryId: draft.categoryId || null,
        paymentMethod: draft.paymentMethod,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao atualizar a recorrência.");
      return;
    }
    router.refresh();
    toast.success("Recorrência atualizada.");
    onClose();
  }

  const periods = buildPeriods({
    rule,
    newAmount: parseCurrencyBR(draft.amount),
    effectiveFrom: draft.effectiveFrom,
    window: bounds,
  });

  return (
    <div className="flex flex-col gap-4">
      <RecurringSeriesHeader
        description={rule.description}
        personName={people.find((p) => p.id === rule.personId)?.name ?? ""}
        range={formatMonthRange(bounds.first, bounds.last)}
        type={rule.type}
        amount={rule.amount}
      />

      {step === "edit" ? (
        <EditRecurringFields
          draft={draft}
          onChange={patchDraft}
          categories={categories}
          window={bounds}
          effectiveFromHint={effectiveFromHint(draft, bounds.first)}
          canReview={hasChanges(draft, rule)}
          onReview={() => setStep("review")}
        />
      ) : (
        <RecurringChangeReview
          type={rule.type}
          periods={periods}
          fieldDiffs={buildFieldDiffs({ rule, draft, categories })}
          summary={buildSummary(periods)}
          saving={saving}
          onBack={() => setStep("edit")}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
