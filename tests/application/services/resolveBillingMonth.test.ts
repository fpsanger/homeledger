import { resolveBillingMonth } from "../../../src/application/services/resolveBillingMonth";
import type { CreditCardRecord } from "../../../src/domain/entities/CreditCard";

const FIXED_CARD: CreditCardRecord = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED",
  fixedClosureDay: 10,
  dueDayOfMonth: 17,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

const VARIABLE_CARD: CreditCardRecord = {
  id: "card-2",
  name: "C6 Bank",
  closureType: "VARIABLE",
  fixedClosureDay: null,
  dueDayOfMonth: 10,
  closureNextMonth: false,
  fixedClosurePreviousMonth: false,
  createdAt: new Date(),
};

describe("resolveBillingMonth", () => {
  it("uses the explicit billing month when given, even for a FIXED card", () => {
    const result = resolveBillingMonth(FIXED_CARD, new Date("2026-05-04"), {
      year: 2026,
      month: 8,
    });
    expect(result).toEqual({ year: 2026, month: 8 });
  });

  it("uses the explicit billing month for a VARIABLE card", () => {
    const result = resolveBillingMonth(VARIABLE_CARD, new Date("2026-05-04"), {
      year: 2026,
      month: 6,
    });
    expect(result).toEqual({ year: 2026, month: 6 });
  });

  it("computes a FIXED card's month from its closure day when none is given", () => {
    expect(resolveBillingMonth(FIXED_CARD, new Date("2026-05-04"))).toEqual({
      year: 2026,
      month: 5,
    });
    expect(resolveBillingMonth(FIXED_CARD, new Date("2026-05-10"))).toEqual({
      year: 2026,
      month: 6,
    });
  });

  it("applies the FIXED card's previous-month closure flag", () => {
    const card = { ...FIXED_CARD, fixedClosurePreviousMonth: true };
    expect(resolveBillingMonth(card, new Date("2026-05-04"))).toEqual({ year: 2026, month: 6 });
  });

  it("applies the FIXED card's next-month closure flag", () => {
    const card = { ...FIXED_CARD, closureNextMonth: true };
    expect(resolveBillingMonth(card, new Date("2026-05-20"))).toEqual({ year: 2026, month: 5 });
  });

  it("throws for a VARIABLE card without a billing month", () => {
    expect(() => resolveBillingMonth(VARIABLE_CARD, new Date("2026-05-04"))).toThrow(
      "Billing month is required for variable-closure cards",
    );
  });

  it("rejects an invalid explicit billing month", () => {
    expect(() =>
      resolveBillingMonth(VARIABLE_CARD, new Date("2026-05-04"), { year: 2026, month: 13 }),
    ).toThrow("Billing month must be between 1 and 12");
  });
});
