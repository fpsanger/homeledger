import { statementBillingMonth } from "@/components/billing-import/statementBillingMonth";

describe("statementBillingMonth", () => {
  it("uses the statement month for a first installment or a refund", () => {
    expect(statementBillingMonth(2026, 9)).toBe("2026-09");
    expect(statementBillingMonth(2026, 9, 1)).toBe("2026-09");
  });

  it("walks back to the bill of the first installment", () => {
    expect(statementBillingMonth(2026, 9, 3)).toBe("2026-07");
  });

  it("crosses the year boundary", () => {
    expect(statementBillingMonth(2026, 2, 4)).toBe("2025-11");
  });
});
