"use client";

import { Repeat } from "lucide-react";
import { TransactionAmount } from "../TransactionAmount";

/** The series being edited, shown above the form so the change always has context. */
export function RecurringSeriesHeader({
  description,
  personName,
  range,
  type,
  amount,
}: {
  description: string;
  personName: string;
  range: string;
  type: string;
  amount: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 truncate text-sm font-medium">
          <Repeat className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {description || "Recorrência"}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {personName && <>{personName} &bull; </>}
          {range}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold tracking-tight tabular-nums">
          <TransactionAmount type={type} amount={amount} />
        </span>
        <p className="text-xs text-muted-foreground">valor atual</p>
      </div>
    </div>
  );
}
