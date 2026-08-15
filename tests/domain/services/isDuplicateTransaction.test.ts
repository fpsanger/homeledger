import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import { findDuplicateTransaction } from "../../../src/domain/services/isDuplicateTransaction";

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

describe("findDuplicateTransaction", () => {
  it("returns matching record when same type, amount, and date exist", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-07")).not.toBeNull();
  });

  it("returns null when amount differs", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 200, "2026-05-07")).toBeNull();
  });

  it("returns null when type differs", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") }),
    ];
    expect(findDuplicateTransaction(existing, "INCOME", 100, "2026-05-07")).toBeNull();
  });

  it("returns null when date is more than 30 days away", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 100, "2026-06-08")).toBeNull();
  });

  it("returns matching record when dates are within 30 days", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07") }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-20")).not.toBeNull();
  });

  it("returns matching record when same day but different time", () => {
    const existing = [
      makeTransaction({ type: "EXPENSE", amount: 100, date: new Date("2026-05-07T23:59:59Z") }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 100, "2026-05-07")).not.toBeNull();
  });

  it("matches across different people (household-wide check)", () => {
    const existing = [
      makeTransaction({
        personId: "person-2",
        type: "EXPENSE",
        amount: 50,
        date: new Date("2026-05-07"),
      }),
    ];
    expect(findDuplicateTransaction(existing, "EXPENSE", 50, "2026-05-07")).not.toBeNull();
  });

  it("returns null when list is empty", () => {
    expect(findDuplicateTransaction([], "EXPENSE", 100, "2026-05-07")).toBeNull();
  });

  it("returns null when amount or date not yet provided", () => {
    const existing = [makeTransaction()];
    expect(findDuplicateTransaction(existing, "EXPENSE", null, "2026-05-07")).toBeNull();
    expect(findDuplicateTransaction(existing, "EXPENSE", 100, null)).toBeNull();
  });
});
