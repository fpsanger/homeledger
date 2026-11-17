import { createPendingTransaction } from "../../../src/domain/entities/PendingTransaction";

const input = {
  id: "pending-1",
  personId: "person-1",
  amount: 12.5,
  occurredAt: new Date("2026-11-17T01:30:00Z"),
  occurredOn: new Date("2026-11-16"),
  merchant: "  Padaria São João ",
  cardName: " Nubank ",
  creditCardId: null,
  suggestedCategoryId: null,
};

describe("createPendingTransaction", () => {
  it("starts PENDING with trimmed text and no resolution", () => {
    const record = createPendingTransaction(input);

    expect(record.status).toBe("PENDING");
    expect(record.resolvedAt).toBeNull();
    expect(record.merchant).toBe("Padaria São João");
    expect(record.cardName).toBe("Nubank");
    expect(record.amount).toBe(12.5);
  });

  it("requires a person", () => {
    expect(() => createPendingTransaction({ ...input, personId: "" })).toThrow(
      "Person is required",
    );
  });

  it.each([0, -3, Number.NaN])("rejects the amount %p", (amount) => {
    expect(() => createPendingTransaction({ ...input, amount })).toThrow("Amount must be positive");
  });

  it("requires a merchant", () => {
    expect(() => createPendingTransaction({ ...input, merchant: "   " })).toThrow(
      "Merchant is required",
    );
  });
});
