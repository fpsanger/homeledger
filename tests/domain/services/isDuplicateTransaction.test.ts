import { isDuplicateTransaction } from "../../../src/domain/services/isDuplicateTransaction";
import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";

function makeTransaction(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: "1",
    personId: "person-1",
    type: "EXPENSE",
    amount: 100,
    date: new Date("2026-05-07"),
    description: "",
    paymentMethod: "CASH",
    source: null,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("isDuplicateTransaction", () => {
  it("returns true when same type, amount, and date exist", () => {
    const existing = [makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") })];
    expect(isDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-07")).toBe(true);
  });

  it("returns false when amount differs", () => {
    const existing = [makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") })];
    expect(isDuplicateTransaction(existing, "EXPENSE", 200, "2026-05-07")).toBe(false);
  });

  it("returns false when type differs", () => {
    const existing = [makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") })];
    expect(isDuplicateTransaction(existing, "INCOME", 100, "2026-05-07")).toBe(false);
  });

  it("returns false when date differs", () => {
    const existing = [makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") })];
    expect(isDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-08")).toBe(false);
  });

  it("returns true when same day but different time", () => {
    const existing = [makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07T23:59:59Z") })];
    expect(isDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-07")).toBe(true);
  });

  it("matches across different people (household-wide check)", () => {
    const existing = [makeTransaction({ personId: "person-2", type: "EXPENSE", amount: 50, date: new Date("2026-05-07") })];
    expect(isDuplicateTransaction(existing, "EXPENSE", 50, "2026-05-07")).toBe(true);
  });

  it("returns false when list is empty", () => {
    expect(isDuplicateTransaction([], "EXPENSE", 100, "2026-05-07")).toBe(false);
  });

  it("returns false when amount or date not yet provided", () => {
    const existing = [makeTransaction()];
    expect(isDuplicateTransaction(existing, "EXPENSE", null, "2026-05-07")).toBe(false);
    expect(isDuplicateTransaction(existing, "EXPENSE", 100, null)).toBe(false);
  });
});
