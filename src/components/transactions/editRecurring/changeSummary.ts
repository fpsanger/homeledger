import { PAYMENT_LABELS } from "../../monthly-view/transactionTableFilters";
import type { Category } from "../types";
import type { ChangePeriod, FieldDiff } from "./RecurringChangeReview";
import { formatMonth, type MonthValue, monthCount, previousMonth } from "./recurringMonths";

type RuleSnapshot = {
  amount: number;
  description: string;
  categoryId: string | null;
  paymentMethod: string;
};

/**
 * The periods the review step shows: the months keeping the current values (omitted when the
 * change starts at the first month of the series) followed by the months taking the new ones.
 */
export function buildPeriods({
  rule,
  newAmount,
  effectiveFrom,
  window: bounds,
}: {
  rule: RuleSnapshot;
  newAmount: number;
  effectiveFrom: MonthValue;
  window: { first: MonthValue; last: MonthValue | null };
}): ChangePeriod[] {
  const changed: ChangePeriod = {
    label: "Passa a",
    from: effectiveFrom,
    to: bounds.last,
    amount: newAmount,
  };

  if (effectiveFrom === bounds.first) return [changed];

  return [
    {
      label: "Mantém",
      from: bounds.first,
      to: previousMonth(effectiveFrom),
      amount: rule.amount,
    },
    changed,
  ];
}

function plural(count: number): string {
  return count === 1 ? "mês" : "meses";
}

function countOf(period: ChangePeriod): number | null {
  return period.to === null ? null : monthCount(period.from, period.to);
}

/** One plain sentence naming how many months keep the current values and how many change. */
export function buildSummary(periods: ChangePeriod[]): string {
  const changed = periods[periods.length - 1];
  const kept = periods.length > 1 ? periods[0] : null;
  const changedCount = countOf(changed);

  if (!kept) {
    return changedCount === null
      ? "Todos os meses da recorrência passam para o novo valor."
      : `Todos os ${changedCount} ${plural(changedCount)} da recorrência passam para o novo valor.`;
  }

  const keptCount = countOf(kept) ?? 0;
  const keptPart = `${keptCount} ${plural(keptCount)} mantêm o valor atual`;

  return changedCount === null
    ? `${keptPart}; a partir de ${formatMonth(changed.from)} vale o novo valor.`
    : `${keptPart}, ${changedCount} ${plural(changedCount)} passam para o novo valor.`;
}

function categoryName(categories: Category[], id: string): string {
  if (!id) return "Sem categoria";
  return categories.find((c) => c.id === id)?.name ?? "Sem categoria";
}

/** The non-monetary fields that actually changed, ready to render as before → after. */
export function buildFieldDiffs({
  rule,
  draft,
  categories,
}: {
  rule: RuleSnapshot;
  draft: { description: string; categoryId: string; paymentMethod: string };
  categories: Category[];
}): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  if (draft.description !== rule.description) {
    diffs.push({ label: "Descrição", before: rule.description, after: draft.description });
  }
  if (draft.categoryId !== (rule.categoryId ?? "")) {
    diffs.push({
      label: "Categoria",
      before: categoryName(categories, rule.categoryId ?? ""),
      after: categoryName(categories, draft.categoryId),
    });
  }
  if (draft.paymentMethod !== rule.paymentMethod) {
    diffs.push({
      label: "Pagamento",
      before: PAYMENT_LABELS[rule.paymentMethod] ?? rule.paymentMethod,
      after: PAYMENT_LABELS[draft.paymentMethod] ?? draft.paymentMethod,
    });
  }

  return diffs;
}
