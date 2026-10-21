import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";
import {
  cancelRecurringTransaction,
  createRecurringTransaction,
  generateOccurrence,
  isActiveInMonth,
  updateRecurringTransaction,
} from "../../../src/domain/services/RecurringTransaction";

const baseInput = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX" as const,
  categoryId: null,
  frequency: "MONTHLY" as const,
  startDate: new Date("2026-01-01"),
  endDate: null,
};

describe("RecurringTransaction service", () => {
  describe("createRecurringTransaction", () => {
    it("returns a record with all input fields", () => {
      const record = createRecurringTransaction(baseInput);

      expect(record.id).toBe("rule-1");
      expect(record.personId).toBe("person-1");
      expect(record.type).toBe("EXPENSE");
      expect(record.amount).toBe(500);
      expect(record.frequency).toBe("MONTHLY");
      expect(record.startDate).toEqual(new Date("2026-01-01"));
      expect(record.endDate).toBeNull();
    });

    it("throws when personId is missing", () => {
      expect(() => createRecurringTransaction({ ...baseInput, personId: "" })).toThrow(
        "Person is required",
      );
    });

    it("throws when amount is zero", () => {
      expect(() => createRecurringTransaction({ ...baseInput, amount: 0 })).toThrow(
        "Amount must be positive",
      );
    });

    it("throws when amount is negative", () => {
      expect(() => createRecurringTransaction({ ...baseInput, amount: -100 })).toThrow(
        "Amount must be positive",
      );
    });

    it("accepts an endDate", () => {
      const record = createRecurringTransaction({
        ...baseInput,
        endDate: new Date("2026-12-31"),
      });

      expect(record.endDate).toEqual(new Date("2026-12-31"));
    });

    it("preserves categoryId", () => {
      const record = createRecurringTransaction({
        ...baseInput,
        categoryId: "cat-1",
      });

      expect(record.categoryId).toBe("cat-1");
    });

    it("throws when startDate is missing", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, startDate: null as unknown as Date }),
      ).toThrow("Start date is required");
    });

    it("accepts ACCOUNT_DEBIT as payment method", () => {
      const record = createRecurringTransaction({ ...baseInput, paymentMethod: "ACCOUNT_DEBIT" });
      expect(record.paymentMethod).toBe("ACCOUNT_DEBIT");
    });
  });

  describe("isActiveInMonth", () => {
    const makeRule = (
      startDate: Date,
      endDate: Date | null = null,
    ): RecurringTransactionRecord => ({
      id: "rule-1",
      personId: "person-1",
      type: "EXPENSE",
      amount: 100,
      description: "Test",
      paymentMethod: "PIX",
      categoryId: null,
      frequency: "MONTHLY",
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("is active when startDate is in the target month", () => {
      const rule = makeRule(new Date("2026-05-15"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
    });

    it("is active when startDate is before the target month", () => {
      const rule = makeRule(new Date("2026-01-01"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
    });

    it("is not active when startDate is after the target month", () => {
      const rule = makeRule(new Date("2026-06-01"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
    });

    it("is active when endDate is null (indefinite)", () => {
      const rule = makeRule(new Date("2026-01-01"), null);
      expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
    });

    it("is not active when endDate is in the target month (canceled this month)", () => {
      const rule = makeRule(new Date("2026-01-01"), new Date("2026-05-15"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
    });

    it("is not active when endDate is before the target month", () => {
      const rule = makeRule(new Date("2026-01-01"), new Date("2026-04-01"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(false);
    });

    it("is active when endDate is in the month after the target", () => {
      const rule = makeRule(new Date("2026-01-01"), new Date("2026-06-01"));
      expect(isActiveInMonth(rule, 2026, 5)).toBe(true);
    });

    it("handles year rollover correctly", () => {
      const rule = makeRule(new Date("2025-11-01"), new Date("2026-02-01"));
      expect(isActiveInMonth(rule, 2026, 1)).toBe(true);
      expect(isActiveInMonth(rule, 2026, 2)).toBe(false);
    });
  });

  describe("generateOccurrence", () => {
    const rule: RecurringTransactionRecord = {
      id: "rule-1",
      personId: "person-1",
      type: "EXPENSE",
      amount: 500,
      description: "Rent",
      paymentMethod: "PIX",
      categoryId: "cat-1",
      frequency: "MONTHLY",
      startDate: new Date("2026-01-15"),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("returns a TransactionRecord with the rule id", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.id).toBe("rule-1");
    });

    it("preserves personId", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.personId).toBe("person-1");
    });

    it("preserves categoryId", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.categoryId).toBe("cat-1");
    });

    it("preserves amount", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.amount).toBe(500);
    });

    it("preserves type", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.type).toBe("EXPENSE");
    });

    it("preserves paymentMethod", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.paymentMethod).toBe("PIX");
    });

    it("date is in the target month and year", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.date.getUTCFullYear()).toBe(2026);
      expect(occ.date.getUTCMonth() + 1).toBe(5);
    });

    it("date preserves the day from startDate", () => {
      const occ = generateOccurrence(rule, 2026, 5);
      expect(occ.date.getUTCDate()).toBe(15);
    });

    it("clamps day to last day of month when startDate day exceeds month length", () => {
      const jan31Rule: RecurringTransactionRecord = {
        ...rule,
        startDate: new Date("2026-01-31"),
      };
      const occ = generateOccurrence(jan31Rule, 2026, 2);
      expect(occ.date.getUTCDate()).toBe(28);
      expect(occ.date.getUTCMonth() + 1).toBe(2);
    });
  });

  describe("cancelRecurringTransaction", () => {
    const rule: RecurringTransactionRecord = {
      id: "rule-1",
      personId: "person-1",
      type: "EXPENSE",
      amount: 500,
      description: "Rent",
      paymentMethod: "PIX",
      categoryId: null,
      frequency: "MONTHLY",
      startDate: new Date("2026-01-01"),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("sets endDate to today", () => {
      const today = new Date("2026-05-15");
      const canceled = cancelRecurringTransaction(rule, today);
      expect(canceled.endDate).toEqual(today);
    });

    it("does not mutate the original rule", () => {
      const today = new Date("2026-05-15");
      cancelRecurringTransaction(rule, today);
      expect(rule.endDate).toBeNull();
    });

    it("preserves all other fields", () => {
      const today = new Date("2026-05-15");
      const canceled = cancelRecurringTransaction(rule, today);
      expect(canceled.id).toBe(rule.id);
      expect(canceled.amount).toBe(rule.amount);
      expect(canceled.personId).toBe(rule.personId);
    });
  });

  describe("updateRecurringTransaction", () => {
    const rule: RecurringTransactionRecord = {
      id: "rule-1",
      personId: "person-1",
      type: "EXPENSE",
      amount: 500,
      description: "Rent",
      paymentMethod: "PIX",
      categoryId: null,
      frequency: "MONTHLY",
      startDate: new Date("2026-01-01"),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // A 12-month series: January through December 2026 (endDate is exclusive).
    const boundedRule: RecurringTransactionRecord = {
      ...rule,
      endDate: new Date(Date.UTC(2027, 0, 1)),
    };
    const newId = "rule-2";
    const april = { year: 2026, month: 4 };

    /** Narrows to a split result so tests can read `closed`/`next` directly. */
    function split(
      target: RecurringTransactionRecord,
      updates: Parameters<typeof updateRecurringTransaction>[1],
      effectiveFrom = april,
    ) {
      const result = updateRecurringTransaction(target, updates, newId, effectiveFrom);
      if (result.kind !== "split") throw new Error(`expected a split, got ${result.kind}`);
      return result;
    }

    it("splits into a closed rule and a new rule", () => {
      expect(split(rule, { amount: 600 }).kind).toBe("split");
    });

    it("closes the original rule at the first day of the effective month", () => {
      const { closed } = split(rule, { amount: 600 });
      expect(closed.id).toBe("rule-1");
      expect(closed.endDate).toEqual(new Date(Date.UTC(2026, 3, 1)));
      expect(closed.amount).toBe(500);
    });

    it("starts the new rule in the effective month with the provided id", () => {
      const { next } = split(rule, { amount: 600 });
      expect(next.id).toBe("rule-2");
      expect(next.startDate).toEqual(new Date(Date.UTC(2026, 3, 1)));
      expect(next.amount).toBe(600);
    });

    it("applies description, category and payment method updates to the new rule only", () => {
      const { closed, next } = split(rule, {
        description: "Aluguel",
        categoryId: "cat-9",
        paymentMethod: "ACCOUNT_DEBIT",
      });
      expect(next.description).toBe("Aluguel");
      expect(next.categoryId).toBe("cat-9");
      expect(next.paymentMethod).toBe("ACCOUNT_DEBIT");
      expect(closed.description).toBe("Rent");
      expect(closed.categoryId).toBeNull();
      expect(closed.paymentMethod).toBe("PIX");
    });

    it("keeps the new rule indefinite when the original was indefinite", () => {
      expect(split(rule, { amount: 600 }).next.endDate).toBeNull();
    });

    it("preserves the original end date so a bounded series keeps its length", () => {
      const { next } = split(boundedRule, { amount: 600 });
      expect(next.endDate).toEqual(new Date(Date.UTC(2027, 0, 1)));
    });

    it("preserves the series day-of-month on the new rule", () => {
      const day15 = { ...rule, startDate: new Date(Date.UTC(2026, 0, 15)) };
      expect(split(day15, { amount: 600 }).next.startDate.getUTCDate()).toBe(15);
    });

    it("clamps the day-of-month when the effective month is shorter", () => {
      const day31 = { ...rule, startDate: new Date(Date.UTC(2026, 0, 31)) };
      const { next } = split(day31, { amount: 600 }, { year: 2026, month: 2 });
      expect(next.startDate).toEqual(new Date(Date.UTC(2026, 1, 28)));
    });

    it("updates in place without splitting when the effective month is the start month", () => {
      const result = updateRecurringTransaction(boundedRule, { amount: 600 }, newId, {
        year: 2026,
        month: 1,
      });
      if (result.kind !== "in-place") throw new Error("expected an in-place update");
      expect(result.rule.id).toBe("rule-1");
      expect(result.rule.amount).toBe(600);
      expect(result.rule.startDate).toEqual(boundedRule.startDate);
      expect(result.rule.endDate).toEqual(boundedRule.endDate);
    });

    it("throws when the effective month is before the series starts", () => {
      expect(() =>
        updateRecurringTransaction(rule, { amount: 600 }, newId, { year: 2025, month: 12 }),
      ).toThrow("Effective month is outside the recurring transaction period");
    });

    it("throws when the effective month is after the series ends", () => {
      expect(() =>
        updateRecurringTransaction(boundedRule, { amount: 600 }, newId, { year: 2027, month: 1 }),
      ).toThrow("Effective month is outside the recurring transaction period");
    });

    it("throws when the updated amount is not positive", () => {
      expect(() => updateRecurringTransaction(rule, { amount: 0 }, newId, april)).toThrow(
        "Amount must be positive",
      );
      expect(() => updateRecurringTransaction(rule, { amount: -10 }, newId, april)).toThrow(
        "Amount must be positive",
      );
    });

    it("does not mutate the original rule", () => {
      split(rule, { amount: 600 });
      expect(rule.amount).toBe(500);
      expect(rule.endDate).toBeNull();
    });

    it("projects the old amount before the effective month and the new one from it onward", () => {
      const { closed, next } = split(boundedRule, { amount: 600 });

      expect(isActiveInMonth(closed, 2026, 3)).toBe(true);
      expect(generateOccurrence(closed, 2026, 3).amount).toBe(500);
      expect(isActiveInMonth(closed, 2026, 4)).toBe(false);

      expect(isActiveInMonth(next, 2026, 3)).toBe(false);
      expect(isActiveInMonth(next, 2026, 4)).toBe(true);
      expect(generateOccurrence(next, 2026, 4).amount).toBe(600);
      expect(isActiveInMonth(next, 2026, 12)).toBe(true);
      expect(isActiveInMonth(next, 2027, 1)).toBe(false);
    });
  });
});
