import {
  type CreditCard,
  computeBillingMonths,
  defaultBillingMonth,
} from "../../../../src/components/transactions/unifiedTransactionForm/billing";

const FIXED: CreditCard = {
  id: "c1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  fixedClosurePreviousMonth: false,
  closureNextMonth: false,
};

const VARIABLE: CreditCard = { ...FIXED, closureType: "VARIABLE", fixedClosureDay: null };

describe("defaultBillingMonth", () => {
  it("returns empty when there is no date", () => {
    expect(defaultBillingMonth("", FIXED)).toBe("");
  });

  it("uses the purchase month for a VARIABLE card or when no card is selected", () => {
    expect(defaultBillingMonth("2026-05-25", VARIABLE)).toBe("2026-05");
    expect(defaultBillingMonth("2026-05-25", undefined)).toBe("2026-05");
  });

  it("FIXED: before the closure day stays in the purchase month", () => {
    expect(defaultBillingMonth("2026-05-09", FIXED)).toBe("2026-05");
  });

  it("FIXED: on/after the closure day moves to the next month, rolling the year", () => {
    expect(defaultBillingMonth("2026-05-10", FIXED)).toBe("2026-06");
    expect(defaultBillingMonth("2026-12-15", FIXED)).toBe("2027-01");
  });

  it("FIXED with previous-month closure shifts by one, or two after the closure day", () => {
    const card = { ...FIXED, fixedClosurePreviousMonth: true };
    expect(defaultBillingMonth("2026-05-09", card)).toBe("2026-06");
    expect(defaultBillingMonth("2026-11-10", card)).toBe("2027-01");
  });

  it("FIXED with next-month closure stays in the purchase month", () => {
    expect(defaultBillingMonth("2026-05-20", { ...FIXED, closureNextMonth: true })).toBe("2026-05");
  });
});

describe("computeBillingMonths", () => {
  it("schedules installments from the chosen billing month across a year boundary", () => {
    expect(computeBillingMonths(100, 3, "2026-11")).toEqual([
      { installmentNumber: 1, dueYear: 2026, dueMonth: 11, amount: 33.33 },
      { installmentNumber: 2, dueYear: 2026, dueMonth: 12, amount: 33.33 },
      { installmentNumber: 3, dueYear: 2027, dueMonth: 1, amount: 33.34 },
    ]);
  });
});
