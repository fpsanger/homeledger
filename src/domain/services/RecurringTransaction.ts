import type { RecurringTransactionRecord } from "../repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../repositories/ITransactionRepository";

type CreateRecurringInput = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: RecurringTransactionRecord["paymentMethod"];
  categoryId: string | null;
  frequency: "MONTHLY";
  startDate: Date;
  endDate: Date | null;
};

export function createRecurringTransaction(
  input: CreateRecurringInput,
): RecurringTransactionRecord {
  if (!input.personId) throw new Error("Person is required");
  if (input.amount <= 0) throw new Error("Amount must be positive");
  if (!input.startDate) throw new Error("Start date is required");

  return {
    id: input.id,
    personId: input.personId,
    type: input.type,
    amount: input.amount,
    description: input.description,
    paymentMethod: input.paymentMethod,
    categoryId: input.categoryId,
    frequency: input.frequency,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function yearMonthOf(date: Date): { y: number; m: number } {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1 };
}

function compareYearMonth(a: { y: number; m: number }, b: { y: number; m: number }): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.m - b.m;
}

export function isActiveInMonth(
  rule: RecurringTransactionRecord,
  year: number,
  month: number,
): boolean {
  const target = { y: year, m: month };
  const start = yearMonthOf(rule.startDate);

  if (compareYearMonth(start, target) > 0) return false;
  if (rule.endDate === null) return true;

  const end = yearMonthOf(rule.endDate);
  return compareYearMonth(end, target) > 0;
}

export function generateOccurrence(
  rule: RecurringTransactionRecord,
  year: number,
  month: number,
): TransactionRecord {
  const startDay = rule.startDate.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(startDay, lastDayOfMonth);

  return {
    id: rule.id,
    personId: rule.personId,
    type: rule.type,
    amount: rule.amount,
    date: new Date(Date.UTC(year, month - 1, day)),
    description: rule.description,
    paymentMethod: rule.paymentMethod,
    source: null,
    categoryId: rule.categoryId,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    isRecurring: true,
  };
}

export function cancelRecurringTransaction(
  rule: RecurringTransactionRecord,
  today: Date,
): RecurringTransactionRecord {
  return { ...rule, endDate: today, updatedAt: new Date() };
}

type UpdateableFields = Partial<
  Pick<
    RecurringTransactionRecord,
    "amount" | "description" | "categoryId" | "paymentMethod" | "frequency"
  >
>;

/** A calendar month, with `month` in 1-12. */
export type YearMonth = { year: number; month: number };

function startDateInMonth(originalStartDate: Date, { year, month }: YearMonth): Date {
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(originalStartDate.getUTCDate(), lastDayOfMonth);
  return new Date(Date.UTC(year, month - 1, day));
}

export type RecurringUpdate =
  /** `effectiveFrom` is the first month of the series, so there is no history to preserve. */
  | { kind: "in-place"; rule: RecurringTransactionRecord }
  /** Earlier months stay on `closed`; `effectiveFrom` onward is served by `next`. */
  | { kind: "split"; closed: RecurringTransactionRecord; next: RecurringTransactionRecord };

/** Applies `updates` from `effectiveFrom` onward, leaving earlier months untouched. */
export function updateRecurringTransaction(
  rule: RecurringTransactionRecord,
  updates: UpdateableFields,
  newId: string,
  effectiveFrom: YearMonth,
): RecurringUpdate {
  if (updates.amount !== undefined && updates.amount <= 0) {
    throw new Error("Amount must be positive");
  }
  if (!isActiveInMonth(rule, effectiveFrom.year, effectiveFrom.month)) {
    throw new Error("Effective month is outside the recurring transaction period");
  }

  const start = yearMonthOf(rule.startDate);
  if (compareYearMonth(start, { y: effectiveFrom.year, m: effectiveFrom.month }) === 0) {
    return { kind: "in-place", rule: { ...rule, ...updates, updatedAt: new Date() } };
  }

  return {
    kind: "split",
    closed: {
      ...rule,
      endDate: new Date(Date.UTC(effectiveFrom.year, effectiveFrom.month - 1, 1)),
      updatedAt: new Date(),
    },
    next: {
      ...rule,
      ...updates,
      id: newId,
      startDate: startDateInMonth(rule.startDate, effectiveFrom),
      endDate: rule.endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}
