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

export function updateRecurringTransaction(
  rule: RecurringTransactionRecord,
  updates: UpdateableFields,
  newId: string,
  today: Date,
): [RecurringTransactionRecord, RecurringTransactionRecord] {
  const closedRule: RecurringTransactionRecord = {
    ...rule,
    endDate: today,
    updatedAt: new Date(),
  };

  const newRule: RecurringTransactionRecord = {
    ...rule,
    ...updates,
    id: newId,
    startDate: today,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return [closedRule, newRule];
}
