"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatAmountBR } from "@/lib/utils";
import type { RecurringDraft } from "./EditRecurringFields";
import type { MonthValue } from "./recurringMonths";

/** The recurrence rule behind a projected row, as the API returns it. */
export type RecurringRule = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: string;
  categoryId: string | null;
  startDate: string;
  endDate: string | null;
};

function draftFrom(rule: RecurringRule, month: MonthValue): RecurringDraft {
  return {
    effectiveFrom: month,
    amount: formatAmountBR(rule.amount),
    description: rule.description,
    categoryId: rule.categoryId ?? "",
    paymentMethod: rule.paymentMethod,
  };
}

/**
 * Loads the rule behind a projected occurrence and seeds an editable draft whose effective month
 * defaults to the month that was clicked. Reports and closes when the rule cannot be loaded.
 */
export function useRecurringRule({
  transactionId,
  viewedMonth,
  onClose,
}: {
  transactionId: string | null;
  viewedMonth: MonthValue | null;
  onClose: () => void;
}) {
  const [rule, setRule] = useState<RecurringRule | null>(null);
  const [draft, setDraft] = useState<RecurringDraft | null>(null);
  const [step, setStep] = useState<"edit" | "review">("edit");

  useEffect(() => {
    if (!transactionId || !viewedMonth) return;
    let active = true;
    setRule(null);
    setDraft(null);
    setStep("edit");

    fetch(`/api/recurring-transactions/${transactionId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Falha ao carregar a recorrência.");
        return data as RecurringRule;
      })
      .then((loaded) => {
        if (!active) return;
        setRule(loaded);
        setDraft(draftFrom(loaded, viewedMonth));
      })
      .catch((error: Error) => {
        if (!active) return;
        toast.error(error.message);
        onClose();
      });

    return () => {
      active = false;
    };
  }, [transactionId, viewedMonth, onClose]);

  const patchDraft = useCallback(
    (patch: Partial<RecurringDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d)),
    [],
  );

  return { rule, draft, patchDraft, step, setStep };
}
