import { useState } from "react";
import { formatAmountBR, parseCurrencyBR } from "@/lib/utils";

export type FormType = "expense" | "income" | "credit";

export type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

export const MONTH_NAMES_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function computeBillingMonths(
  totalAmount: number,
  n: number,
  date: string,
  card: CreditCard,
): Array<{ installmentNumber: number; dueYear: number; dueMonth: number; amount: number }> {
  const d = new Date(`${date}T00:00:00Z`);
  const purchaseDay = d.getUTCDate();
  const purchaseYear = d.getUTCFullYear();
  const purchaseMonth = d.getUTCMonth() + 1;
  if (card.fixedClosureDay == null) {
    throw new Error("Credit card closure day must be resolved before calculating billing months");
  }
  const closureDay = card.fixedClosureDay;

  const shiftNext =
    card.alwaysNextMonth ||
    card.fixedClosurePreviousMonth ||
    (!card.closureNextMonth && purchaseDay >= closureDay);

  let firstYear = purchaseYear;
  let firstMonth = purchaseMonth;

  if (shiftNext) {
    const shiftBy = card.fixedClosurePreviousMonth && purchaseDay >= closureDay ? 2 : 1;
    const targetMonth = purchaseMonth + shiftBy;
    if (targetMonth > 12) {
      firstYear = purchaseYear + 1;
      firstMonth = targetMonth - 12;
    } else {
      firstMonth = targetMonth;
    }
  }

  const baseAmount = Math.floor((totalAmount / n) * 100) / 100;
  const firstAbsolute = (firstYear - 1) * 12 + (firstMonth - 1);

  return Array.from({ length: n }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12) + 1;
    const dueMonth = (absolute % 12) + 1;
    const isLast = i === n - 1;
    const amount = isLast
      ? Math.round((totalAmount - baseAmount * (n - 1)) * 100) / 100
      : baseAmount;
    return { installmentNumber: i + 1, dueYear, dueMonth, amount };
  });
}

export type ClosureRecord = {
  year: number;
  month: number;
  closureDay: number;
  previousMonth: boolean;
};

export type SplitRow = { personId: string; amount: string; edited: boolean };

export function toCents(brValue: string): number {
  const n = parseCurrencyBR(brValue);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromCents(cents: number): string {
  return formatAmountBR(cents / 100);
}

export function rebalanceSplits(rows: SplitRow[], totalCents: number): SplitRow[] {
  const editedCents = rows.filter((r) => r.edited).reduce((sum, r) => sum + toCents(r.amount), 0);
  const autoRows = rows.filter((r) => !r.edited);
  if (autoRows.length === 0) return rows;

  const remainingCents = Math.max(totalCents - editedCents, 0);
  const shareCents = Math.floor(remainingCents / autoRows.length);
  let assigned = 0;
  let autoIndex = 0;

  return rows.map((row) => {
    if (row.edited) return row;
    autoIndex += 1;
    const cents = autoIndex === autoRows.length ? remainingCents - assigned : shareCents;
    assigned += cents;
    return { ...row, amount: fromCents(cents) };
  });
}

export function useSplitRows(totalCents: number, defaultPersonId: string) {
  const [splitMode, setSplitMode] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);

  function toggleSplitMode() {
    const turningOn = !splitMode;
    setSplitMode(turningOn);
    setSplitRows(
      turningOn && defaultPersonId
        ? [{ personId: defaultPersonId, amount: fromCents(totalCents), edited: false }]
        : [],
    );
  }

  function addSplitPerson(id: string) {
    if (!id) return;
    setSplitRows((rows) =>
      rebalanceSplits([...rows, { personId: id, amount: "0,00", edited: false }], totalCents),
    );
  }

  function removeSplitPerson(index: number) {
    setSplitRows((rows) =>
      rebalanceSplits(
        rows.filter((_, i) => i !== index),
        totalCents,
      ),
    );
  }

  function setSplitAmount(index: number, value: string) {
    setSplitRows((rows) =>
      rebalanceSplits(
        rows.map((r, i) => (i === index ? { ...r, amount: value, edited: true } : r)),
        totalCents,
      ),
    );
  }

  function rebalanceForNewTotal(newTotalCents: number) {
    setSplitRows((rows) => rebalanceSplits(rows, newTotalCents));
  }

  const allocatedCents = splitRows.reduce((sum, r) => sum + toCents(r.amount), 0);
  const remainingCents = totalCents - allocatedCents;
  const isValid = isSplitComplete(splitRows.length, remainingCents);

  return {
    splitMode,
    splitRows,
    toggleSplitMode,
    addSplitPerson,
    removeSplitPerson,
    setSplitAmount,
    rebalanceForNewTotal,
    remainingCents,
    isValid,
    reset: () => {
      setSplitMode(false);
      setSplitRows([]);
    },
  };
}

export function isSplitComplete(rowCount: number, remainingCents: number): boolean {
  return rowCount >= 2 && remainingCents === 0;
}

export function isCreditFlagActive(
  type: FormType,
  isEditMode: boolean,
  splitMode: boolean,
): boolean {
  return type === "credit" && !isEditMode && splitMode;
}
