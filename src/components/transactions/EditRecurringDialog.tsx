"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { parseCurrencyBR } from "@/lib/utils";
import { buildFieldDiffs, buildPeriods, buildSummary } from "./editRecurring/changeSummary";
import { EditRecurringFields, type RecurringDraft } from "./editRecurring/EditRecurringFields";
import { RecurringChangeReview } from "./editRecurring/RecurringChangeReview";
import { RecurringSeriesHeader } from "./editRecurring/RecurringSeriesHeader";
import {
  formatMonth,
  formatMonthRange,
  type MonthValue,
  seriesWindow,
  toMonthValue,
} from "./editRecurring/recurringMonths";
import { type RecurringRule, useRecurringRule } from "./editRecurring/useRecurringRule";
import type { Category, Person, Transaction } from "./types";

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

function LoadingBody() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function EditRecurringDialog({
  transaction,
  people,
  categories,
  onClose,
}: {
  transaction: Transaction | null;
  people: Person[];
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { rule, draft, patchDraft, step, setStep } = useRecurringRule({
    transactionId: transaction?.id ?? null,
    viewedMonth: transaction ? toMonthValue(transaction.date) : null,
    onClose,
  });

  async function handleConfirm() {
    if (!rule || !draft) return;
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

  const bounds = rule ? seriesWindow(rule) : null;
  const periods =
    rule && draft && bounds
      ? buildPeriods({
          rule,
          newAmount: parseCurrencyBR(draft.amount),
          effectiveFrom: draft.effectiveFrom,
          window: bounds,
        })
      : [];

  return (
    <Dialog
      open={transaction !== null}
      onClose={onClose}
      title={step === "edit" ? "Editar recorrência" : "Confirmar alteração"}
    >
      {!rule || !draft || !bounds ? (
        <LoadingBody />
      ) : (
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
      )}
    </Dialog>
  );
}
