import { useState } from "react";
import { formatAmountBR, parseCurrencyBR } from "@/lib/utils";

export type FormType = "expense" | "income" | "credit";

export type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
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

/** "YYYY-MM" of the bill a purchase lands on when the user does not pick one. */
export function defaultBillingMonth(date: string, card: CreditCard | undefined): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  const purchaseDay = d.getUTCDate();
  const purchaseYear = d.getUTCFullYear();
  const purchaseMonth = d.getUTCMonth() + 1;
  if (!card || card.closureType === "VARIABLE" || card.fixedClosureDay == null) {
    return toBillingMonthValue(purchaseYear, purchaseMonth);
  }
  const closureDay = card.fixedClosureDay;

  const shiftNext =
    card.fixedClosurePreviousMonth || (!card.closureNextMonth && purchaseDay >= closureDay);
  if (!shiftNext) return toBillingMonthValue(purchaseYear, purchaseMonth);

  const shiftBy = card.fixedClosurePreviousMonth && purchaseDay >= closureDay ? 2 : 1;
  const absolute = purchaseYear * 12 + (purchaseMonth - 1) + shiftBy;
  return toBillingMonthValue(Math.floor(absolute / 12), (absolute % 12) + 1);
}

/** Billing month the user picked, falling back to the card's default for the date. */
export function useBillingMonth(date: string, card: CreditCard | undefined) {
  const [override, setOverride] = useState("");
  return {
    billingMonth: override || defaultBillingMonth(date, card),
    setBillingMonth: setOverride,
    resetBillingMonth: () => setOverride(""),
  };
}

export function toBillingMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * How a total splits across `n` installments: every installment gets the floored share and the
 * last one absorbs the remainder. Single source of this rule for the fields, the summary line and
 * the schedule, so none of them can disagree.
 */
export function splitInstallmentCents(
  totalCents: number,
  n: number,
): { baseCents: number; lastCents: number } {
  if (n < 1) return { baseCents: totalCents, lastCents: totalCents };
  const baseCents = Math.floor(totalCents / n);
  return { baseCents, lastCents: totalCents - baseCents * (n - 1) };
}

export function computeBillingMonths(
  totalAmount: number,
  n: number,
  billingMonth: string,
): Array<{ installmentNumber: number; dueYear: number; dueMonth: number; amount: number }> {
  const [firstYear, firstMonth] = billingMonth.split("-").map(Number);
  const { baseCents, lastCents } = splitInstallmentCents(Math.round(totalAmount * 100), n);
  const firstAbsolute = firstYear * 12 + (firstMonth - 1);

  return Array.from({ length: n }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12);
    const dueMonth = (absolute % 12) + 1;
    const cents = i === n - 1 ? lastCents : baseCents;
    return { installmentNumber: i + 1, dueYear, dueMonth, amount: cents / 100 };
  });
}

export type SplitRow = { personId: string; amount: string; edited: boolean };

export function toCents(brValue: string): number {
  const n = parseCurrencyBR(brValue);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromCents(cents: number): string {
  return formatAmountBR(cents / 100);
}

/**
 * The total and the per-installment amount are two views of the same money. Whichever one the user
 * typed last stays put; the other is derived from it and the installment count.
 */
export type AmountLink = {
  amount: string;
  installmentAmount: string;
  numberOfInstallments: string;
  lastEdited: "total" | "installment";
};

function toCount(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function linkFromTotal(amount: string, numberOfInstallments: string): AmountLink {
  const n = toCount(numberOfInstallments);
  const { baseCents } = splitInstallmentCents(toCents(amount), n);
  return {
    amount,
    installmentAmount: amount ? fromCents(baseCents) : "",
    numberOfInstallments,
    lastEdited: "total",
  };
}

export function linkFromInstallment(
  installmentAmount: string,
  numberOfInstallments: string,
): AmountLink {
  const n = toCount(numberOfInstallments);
  return {
    amount: installmentAmount ? fromCents(toCents(installmentAmount) * n) : "",
    installmentAmount,
    numberOfInstallments,
    lastEdited: "installment",
  };
}

export function linkWithCount(link: AmountLink, numberOfInstallments: string): AmountLink {
  return link.lastEdited === "installment"
    ? linkFromInstallment(link.installmentAmount, numberOfInstallments)
    : linkFromTotal(link.amount, numberOfInstallments);
}

/**
 * Amount state for the form. Every mutator returns the resulting total in cents so the caller can
 * rebalance the split rows without reaching back into this hook's state.
 */
export function useInstallmentAmounts(initialAmount: string) {
  const [link, setLink] = useState<AmountLink>(() => linkFromTotal(initialAmount, "1"));

  function apply(next: AmountLink): number {
    setLink(next);
    return toCents(next.amount);
  }

  return {
    amount: link.amount,
    installmentAmount: link.installmentAmount,
    numberOfInstallments: link.numberOfInstallments,
    setTotal: (value: string) => apply(linkFromTotal(value, link.numberOfInstallments)),
    setInstallment: (value: string) => apply(linkFromInstallment(value, link.numberOfInstallments)),
    setCount: (value: string) => apply(linkWithCount(link, value)),
    reset: (amount = "") => apply(linkFromTotal(amount, "1")),
  };
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
