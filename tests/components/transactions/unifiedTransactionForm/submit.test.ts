import { isSubmitDisabled } from "../../../../src/components/transactions/unifiedTransactionForm/submit";

describe("isSubmitDisabled", () => {
  it("blocks while a request is in flight", () => {
    expect(isSubmitDisabled(true, false, true)).toBe(true);
  });

  it("allows a submit that is not split", () => {
    expect(isSubmitDisabled(false, false, false)).toBe(false);
  });

  it("blocks a split that does not add up to the total", () => {
    expect(isSubmitDisabled(false, true, false)).toBe(true);
  });

  it("allows a split that reconciles", () => {
    expect(isSubmitDisabled(false, true, true)).toBe(false);
  });
});
