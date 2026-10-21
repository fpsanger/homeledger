"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransactionAmount } from "../TransactionAmount";
import { formatMonthRange, type MonthValue, monthCount } from "./recurringMonths";

export type ChangePeriod = {
  label: string;
  from: MonthValue;
  to: MonthValue | null;
  amount: number;
};

export type FieldDiff = { label: string; before: string; after: string };

function monthsLabel(from: MonthValue, to: MonthValue | null): string | null {
  if (to === null) return null;
  const count = monthCount(from, to);
  return `${count} ${count === 1 ? "mês" : "meses"}`;
}

function PeriodRow({
  period,
  type,
  highlighted,
}: {
  period: ChangePeriod;
  type: string;
  highlighted: boolean;
}) {
  const months = monthsLabel(period.from, period.to);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5",
        highlighted && "bg-accent/40",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium">{period.label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatMonthRange(period.from, period.to)}
          {months && <> &bull; {months}</>}
        </span>
      </div>
      <span className="shrink-0 text-sm font-semibold tracking-tight tabular-nums">
        <TransactionAmount type={type} amount={period.amount} />
      </span>
    </div>
  );
}

export function RecurringChangeReview({
  type,
  periods,
  fieldDiffs,
  summary,
  saving,
  onBack,
  onConfirm,
}: {
  type: string;
  /** The unchanged period first (when there is one), then the period being changed. */
  periods: ChangePeriod[];
  fieldDiffs: FieldDiff[];
  summary: string;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="divide-y rounded-lg border">
        {periods.map((period, index) => (
          <PeriodRow
            key={period.label}
            period={period}
            type={type}
            highlighted={index === periods.length - 1}
          />
        ))}
      </div>

      {fieldDiffs.length > 0 && (
        <dl className="flex flex-col gap-1.5 text-xs">
          {fieldDiffs.map((diff) => (
            <div key={diff.label} className="flex items-baseline gap-2">
              <dt className="font-medium text-muted-foreground">{diff.label}</dt>
              <dd className="min-w-0 flex-1">
                <span className="text-muted-foreground line-through">{diff.before || "—"}</span>
                <span className="mx-1.5 text-muted-foreground">&rarr;</span>
                <span className="font-medium">{diff.after || "—"}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="text-sm text-muted-foreground">{summary}</p>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Voltar
        </Button>
        <Button ref={confirmRef} type="button" onClick={onConfirm} disabled={saving}>
          {saving ? "Salvando…" : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
