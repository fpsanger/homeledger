import { parseBillingMonth } from "../../../../src/app/api/_lib/billingMonth";

describe("parseBillingMonth", () => {
  it("returns no value when the field is absent or empty", () => {
    expect(parseBillingMonth(undefined)).toEqual({});
    expect(parseBillingMonth(null)).toEqual({});
    expect(parseBillingMonth("")).toEqual({});
  });

  it("parses a YYYY-MM string", () => {
    expect(parseBillingMonth("2026-11")).toEqual({ value: { year: 2026, month: 11 } });
  });

  it.each(["2026-13", "2026-00", "2026-1", "11/2026", "2026-11-01"])("rejects %p", (raw) => {
    expect(parseBillingMonth(raw)).toEqual({ error: "billingMonth must be in YYYY-MM format" });
  });

  it("rejects a non-string value", () => {
    expect(parseBillingMonth(202611)).toEqual({ error: "billingMonth must be in YYYY-MM format" });
  });
});
