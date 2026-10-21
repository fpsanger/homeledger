import {
  type CreditCard,
  computeBillingMonths,
  defaultBillingMonth,
  isInstallmentEntry,
  linkFromInstallment,
  linkFromTotal,
  linkWithCount,
  splitInstallmentCents,
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

describe("splitInstallmentCents", () => {
  it("splits evenly when the total divides", () => {
    expect(splitInstallmentCents(30000, 3)).toEqual({ baseCents: 10000, lastCents: 10000 });
  });

  it("puts the remainder on the last installment", () => {
    expect(splitInstallmentCents(10000, 3)).toEqual({ baseCents: 3333, lastCents: 3334 });
    expect(splitInstallmentCents(10000, 7)).toEqual({ baseCents: 1428, lastCents: 1432 });
  });

  it("returns the whole total for a single installment", () => {
    expect(splitInstallmentCents(10000, 1)).toEqual({ baseCents: 10000, lastCents: 10000 });
  });
});

describe("linkFromTotal", () => {
  it("derives the floored installment amount", () => {
    expect(linkFromTotal("100,00", "3")).toEqual({
      amount: "100,00",
      installmentAmount: "33,33",
      numberOfInstallments: "3",
      lastEdited: "total",
    });
  });

  it("leaves the installment amount empty while the total is empty", () => {
    expect(linkFromTotal("", "3").installmentAmount).toBe("");
  });
});

describe("linkFromInstallment", () => {
  it("multiplies the installment amount by the count", () => {
    expect(linkFromInstallment("50,00", "3")).toEqual({
      amount: "150,00",
      installmentAmount: "50,00",
      numberOfInstallments: "3",
      lastEdited: "installment",
    });
  });

  it("shows the total it actually produces when the figures do not reconcile", () => {
    expect(linkFromInstallment("33,33", "3").amount).toBe("99,99");
  });

  it("leaves the total empty while the installment amount is empty", () => {
    expect(linkFromInstallment("", "3").amount).toBe("");
  });
});

describe("linkWithCount", () => {
  it("keeps the total and moves the installment amount after a total edit", () => {
    const link = linkWithCount(linkFromTotal("300,00", "3"), "4");
    expect(link).toMatchObject({ amount: "300,00", installmentAmount: "75,00" });
  });

  it("keeps the installment amount and moves the total after an installment edit", () => {
    const link = linkWithCount(linkFromInstallment("50,00", "3"), "6");
    expect(link).toMatchObject({ amount: "300,00", installmentAmount: "50,00" });
  });
});

describe("isInstallmentEntry", () => {
  it("is true only while creating a credit purchase", () => {
    expect(isInstallmentEntry("credit", false)).toBe(true);
    expect(isInstallmentEntry("credit", true)).toBe(false);
    expect(isInstallmentEntry("expense", false)).toBe(false);
    expect(isInstallmentEntry("income", false)).toBe(false);
  });
});
