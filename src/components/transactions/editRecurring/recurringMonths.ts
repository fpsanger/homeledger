import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** A month as `yyyy-MM`, the shape `MonthPicker` works in. */
export type MonthValue = string;

function parse(value: MonthValue): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function ordinal(value: MonthValue): number {
  const { year, month } = parse(value);
  return year * 12 + (month - 1);
}

function fromOrdinal(n: number): MonthValue {
  const year = Math.floor(n / 12);
  const month = (n % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The `yyyy-MM` month a stored UTC date falls in. */
export function toMonthValue(date: Date | string): MonthValue {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousMonth(value: MonthValue): MonthValue {
  return fromOrdinal(ordinal(value) - 1);
}

/** Inclusive count of months from `from` to `to`. */
export function monthCount(from: MonthValue, to: MonthValue): number {
  return ordinal(to) - ordinal(from) + 1;
}

/**
 * The months a rule actually covers, as picker bounds. `endDate` is exclusive, so the last covered
 * month is the one before it; an open-ended rule has no upper bound.
 */
export function seriesWindow(rule: { startDate: Date | string; endDate: Date | string | null }): {
  first: MonthValue;
  last: MonthValue | null;
} {
  return {
    first: toMonthValue(rule.startDate),
    last: rule.endDate ? previousMonth(toMonthValue(rule.endDate)) : null,
  };
}

/** "jan/2026" */
export function formatMonth(value: MonthValue): string {
  const { year, month } = parse(value);
  return format(new Date(year, month - 1, 1), "MMM/yyyy", { locale: ptBR });
}

/** "jan/2026 — mar/2026", "mar/2026" for a single month, "abr/2026 em diante" when open-ended. */
export function formatMonthRange(from: MonthValue, to: MonthValue | null): string {
  if (to === null) return `${formatMonth(from)} em diante`;
  if (from === to) return formatMonth(from);
  return `${formatMonth(from)} — ${formatMonth(to)}`;
}
