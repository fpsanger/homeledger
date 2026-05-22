import { isDuplicateCreditCardPurchase } from "../../../src/domain/services/isDuplicateCreditCardPurchase";
import type { CreditCardPurchaseRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

function makePurchase(overrides: Partial<CreditCardPurchaseRecord> = {}): CreditCardPurchaseRecord {
  return {
    id: "1",
    personId: "person-1",
    creditCardId: "card-1",
    description: "",
    totalAmount: 100,
    numberOfInstallments: 1,
    purchaseDate: new Date("2026-05-07"),
    categoryId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("isDuplicateCreditCardPurchase", () => {
  it("returns true when same amount, date, and creditCardId exist", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(isDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-1")).toBe(true);
  });

  it("returns false when amount differs", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(isDuplicateCreditCardPurchase(existing, 200, "2026-05-07", "card-1")).toBe(false);
  });

  it("returns false when date differs", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(isDuplicateCreditCardPurchase(existing, 100, "2026-05-08", "card-1")).toBe(false);
  });

  it("returns false when creditCardId differs", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(isDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-2")).toBe(false);
  });

  it("returns true when same day but different time", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07T23:59:59Z"),
        creditCardId: "card-1",
      }),
    ];
    expect(isDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-1")).toBe(true);
  });

  it("returns false when list is empty", () => {
    expect(isDuplicateCreditCardPurchase([], 100, "2026-05-07", "card-1")).toBe(false);
  });

  it("returns false when amount is null", () => {
    const existing = [makePurchase()];
    expect(isDuplicateCreditCardPurchase(existing, null, "2026-05-07", "card-1")).toBe(false);
  });

  it("returns false when date is null", () => {
    const existing = [makePurchase()];
    expect(isDuplicateCreditCardPurchase(existing, 100, null, "card-1")).toBe(false);
  });

  it("returns false when creditCardId is null", () => {
    const existing = [makePurchase()];
    expect(isDuplicateCreditCardPurchase(existing, 100, "2026-05-07", null)).toBe(false);
  });
});
