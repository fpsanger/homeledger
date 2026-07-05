import { findDuplicateRecurringTransaction } from "../../../src/domain/services/isDuplicateRecurringTransaction";
import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";

function makeRule(overrides: Partial<RecurringTransactionRecord> = {}): RecurringTransactionRecord {
  return {
    id: "rule-1",
    personId: "person-1",
    type: "EXPENSE",
    amount: 500,
    description: "Rent",
    paymentMethod: "PIX",
    categoryId: null,
    frequency: "MONTHLY",
    startDate: new Date("2026-05-01"),
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("findDuplicateRecurringTransaction", () => {
  it("returns matching rule when same type and amount exist", () => {
    const existing = [makeRule({ type: "EXPENSE", amount: 500 })];
    expect(findDuplicateRecurringTransaction(existing, "EXPENSE", 500)).not.toBeNull();
  });

  it("returns null when amount differs", () => {
    const existing = [makeRule({ type: "EXPENSE", amount: 500 })];
    expect(findDuplicateRecurringTransaction(existing, "EXPENSE", 600)).toBeNull();
  });

  it("returns null when type differs", () => {
    const existing = [makeRule({ type: "EXPENSE", amount: 500 })];
    expect(findDuplicateRecurringTransaction(existing, "INCOME", 500)).toBeNull();
  });

  it("matches across different people (household-wide check)", () => {
    const existing = [makeRule({ personId: "person-2", type: "EXPENSE", amount: 500 })];
    expect(findDuplicateRecurringTransaction(existing, "EXPENSE", 500)).not.toBeNull();
  });

  it("returns null when list is empty", () => {
    expect(findDuplicateRecurringTransaction([], "EXPENSE", 500)).toBeNull();
  });

  it("returns null when amount is not yet provided", () => {
    const existing = [makeRule()];
    expect(findDuplicateRecurringTransaction(existing, "EXPENSE", null)).toBeNull();
  });
});
