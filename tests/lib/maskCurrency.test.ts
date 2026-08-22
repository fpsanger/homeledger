import { maskCurrency } from "@/lib/maskCurrency";

describe("maskCurrency", () => {
  it("returns the formatted value unchanged when not hidden", () => {
    expect(maskCurrency("R$ 1.234,56", false)).toBe("R$ 1.234,56");
  });

  it("returns a fixed mask when hidden, regardless of value length", () => {
    const shortMask = maskCurrency("R$ 1,00", true);
    const longMask = maskCurrency("R$ 1.234.567,89", true);
    expect(shortMask).toBe(longMask);
    expect(shortMask).not.toContain("1");
  });
});
