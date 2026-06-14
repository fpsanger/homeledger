import { findDuplicateCreditCardPurchase } from "../../../src/domain/services/isDuplicateCreditCardPurchase";
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

describe("findDuplicateCreditCardPurchase", () => {
  it("returns matching record when same amount, date, and creditCardId exist", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-1")).not.toBeNull();
  });

  it("returns null when amount differs", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 200, "2026-05-07", "card-1")).toBeNull();
  });

  it("returns null when date is more than 30 days away", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-06-08", "card-1")).toBeNull();
  });

  it("returns matching record when dates are within 30 days", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-05-20", "card-1")).not.toBeNull();
  });

  it("returns null when creditCardId differs", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-2")).toBeNull();
  });

  it("returns matching record when same day but different time", () => {
    const existing = [
      makePurchase({
        totalAmount: 100,
        purchaseDate: new Date("2026-05-07T23:59:59Z"),
        creditCardId: "card-1",
      }),
    ];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-05-07", "card-1")).not.toBeNull();
  });

  it("returns null when list is empty", () => {
    expect(findDuplicateCreditCardPurchase([], 100, "2026-05-07", "card-1")).toBeNull();
  });

  it("returns null when amount is null", () => {
    const existing = [makePurchase()];
    expect(findDuplicateCreditCardPurchase(existing, null, "2026-05-07", "card-1")).toBeNull();
  });

  it("returns null when date is null", () => {
    const existing = [makePurchase()];
    expect(findDuplicateCreditCardPurchase(existing, 100, null, "card-1")).toBeNull();
  });

  it("returns null when creditCardId is null", () => {
    const existing = [makePurchase()];
    expect(findDuplicateCreditCardPurchase(existing, 100, "2026-05-07", null)).toBeNull();
  });
});
