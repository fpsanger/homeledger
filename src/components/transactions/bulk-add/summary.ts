import { isBlankPurchaseRow } from "../../credit-cards/bulk-add/types";
import type { CardSectionState } from "../../credit-cards/bulk-add/useCardSections";
import { toCents } from "../unifiedTransactionForm/billing";
import { type BulkRow, isBlankRow } from "./types";

export type Totals = { count: number; expenseCents: number; incomeCents: number };

/** Rows that still have something to send: not saved yet and not an untouched starter row. */
export function pendingRows<T extends { status: string }>(
  rows: T[],
  isBlank: (row: T) => boolean,
): T[] {
  return rows.filter((row) => row.status !== "success" && !isBlank(row));
}

export function pendingNormalRows(rows: BulkRow[]): BulkRow[] {
  return pendingRows(rows, isBlankRow);
}

export function pendingCardRows(section: CardSectionState) {
  return pendingRows(section.rows, isBlankPurchaseRow);
}

export function summarizeNormal(rows: BulkRow[]): Totals {
  const totals: Totals = { count: 0, expenseCents: 0, incomeCents: 0 };
  for (const row of pendingNormalRows(rows)) {
    totals.count += 1;
    if (row.type === "income") totals.incomeCents += toCents(row.amount);
    else totals.expenseCents += toCents(row.amount);
  }
  return totals;
}

/** Card purchases are spending: the purchase total, however many installments it is split in. */
export function summarizeCards(sections: CardSectionState[]): Totals {
  const rows = sections.flatMap(pendingCardRows);
  return {
    count: rows.length,
    expenseCents: rows.reduce((sum, row) => sum + toCents(row.amount), 0),
    incomeCents: 0,
  };
}
