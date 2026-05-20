import {
  cancelRecurringTransaction,
  createRecurringTransaction,
  generateOccurrence,
  isActiveInMonth,
  updateRecurringTransaction,
} from "../../../src/domain/services/RecurringTransaction";
import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";

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
      expect(() =>
        createRecurringTransaction({ ...baseInput, personId: "" }),
      ).toThrow("Person is required");
    });

    it("throws when amount is zero", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, amount: 0 }),
      ).toThrow("Amount must be positive");
    });

    it("throws when amount is negative", () => {
      expect(() =>
        createRecurringTransaction({ ...baseInput, amount: -100 }),
      ).toThrow("Amount must be positive");
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
    const today = new Date("2026-05-15");
    const newId = "rule-2";

    it("returns a tuple of two rules", () => {
      const result = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(result).toHaveLength(2);
    });

    it("first rule (closed) has endDate set to today", () => {
      const [closed] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(closed.endDate).toEqual(today);
      expect(closed.id).toBe("rule-1");
    });

    it("second rule (new) has startDate set to today", () => {
      const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(newRule.startDate).toEqual(today);
    });

    it("second rule has the provided new id", () => {
      const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(newRule.id).toBe("rule-2");
    });

    it("second rule has the updated amount", () => {
      const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(newRule.amount).toBe(600);
    });

    it("second rule has null endDate (indefinite)", () => {
      const [, newRule] = updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(newRule.endDate).toBeNull();
    });

    it("does not mutate the original rule", () => {
      updateRecurringTransaction(rule, { amount: 600 }, newId, today);
      expect(rule.amount).toBe(500);
      expect(rule.endDate).toBeNull();
    });
  });
});
