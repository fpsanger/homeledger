import { parseDateUTC, parseYearMonth } from "../../../../src/app/api/_lib/date";

describe("parseYearMonth", () => {
  it("returns no value when the field is absent or empty", () => {
    expect(parseYearMonth(undefined, "effectiveFrom")).toEqual({});
    expect(parseYearMonth(null, "effectiveFrom")).toEqual({});
    expect(parseYearMonth("", "effectiveFrom")).toEqual({});
  });

  it("parses a YYYY-MM string", () => {
    expect(parseYearMonth("2026-04", "effectiveFrom")).toEqual({
      value: { year: 2026, month: 4 },
    });
  });

  it("accepts the first and last month of a year", () => {
    expect(parseYearMonth("2026-01", "effectiveFrom").value).toEqual({ year: 2026, month: 1 });
    expect(parseYearMonth("2026-12", "effectiveFrom").value).toEqual({ year: 2026, month: 12 });
  });

  it.each([
    "2026-13",
    "2026-00",
    "2026-4",
    "04/2026",
    "2026-04-01",
    "abcd-ef",
  ])("rejects %p", (raw) => {
    expect(parseYearMonth(raw, "effectiveFrom")).toEqual({
      error: "effectiveFrom must be in YYYY-MM format",
    });
  });

  it("rejects a non-string value", () => {
    expect(parseYearMonth(202604, "effectiveFrom")).toEqual({
      error: "effectiveFrom must be in YYYY-MM format",
    });
  });

  it("names the offending field in the error", () => {
    expect(parseYearMonth("nope", "billingMonth").error).toBe(
      "billingMonth must be in YYYY-MM format",
    );
  });
});

describe("parseDateUTC", () => {
  it("parses a plain date at UTC midnight", () => {
    expect(parseDateUTC("2026-04-15")).toEqual(new Date(Date.UTC(2026, 3, 15)));
  });

  it("ignores the time part of an ISO string", () => {
    expect(parseDateUTC("2026-04-15T23:30:00.000Z")).toEqual(new Date(Date.UTC(2026, 3, 15)));
  });
});
