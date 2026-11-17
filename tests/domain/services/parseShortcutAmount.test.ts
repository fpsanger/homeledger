import { parseShortcutAmount } from "../../../src/domain/services/parseShortcutAmount";

describe("parseShortcutAmount", () => {
  it.each([
    ["12,50", 12.5],
    ["R$ 12,50", 12.5],
    ["R$ 12,50", 12.5],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["12.50", 12.5],
    ["12.5", 12.5],
    ["1.234", 1234],
    ["1.234.567", 1234567],
    ["12", 12],
    ["0,99", 0.99],
  ])("parses %s as %d", (raw, expected) => {
    expect(parseShortcutAmount(raw)).toBe(expected);
  });

  it("accepts a plain number and rounds it to cents", () => {
    expect(parseShortcutAmount(12.5)).toBe(12.5);
    expect(parseShortcutAmount(10.004)).toBe(10);
    expect(parseShortcutAmount(10.006)).toBe(10.01);
  });

  it.each([
    [""],
    ["   "],
    ["abc"],
    ["R$"],
    ["0"],
    ["0,00"],
    ["-5,00"],
    ["R$ -5,00"],
    ["R$-5,00"],
    ["5,00-"],
    ["−5,00"],
    [Number.NaN],
    [-1],
    [0],
  ])("rejects %p", (raw) => {
    expect(() => parseShortcutAmount(raw)).toThrow("Amount must be a positive number");
  });
});
