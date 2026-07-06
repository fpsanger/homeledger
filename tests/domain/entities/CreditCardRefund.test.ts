import { createCreditCardRefund } from "../../../src/domain/entities/CreditCardRefund";

const base = {
  id: "refund-1",
  creditCardId: "card-1",
  personId: "person-1",
  description: "Estorno loja X",
  amount: 150.5,
  refundDate: new Date("2026-07-05T00:00:00Z"),
  dueYear: 2026,
  dueMonth: 7,
  categoryId: null,
  source: "MANUAL" as const,
};

describe("createCreditCardRefund", () => {
  it("creates a refund with all fields", () => {
    const refund = createCreditCardRefund(base);
    expect(refund.id).toBe("refund-1");
    expect(refund.creditCardId).toBe("card-1");
    expect(refund.personId).toBe("person-1");
    expect(refund.description).toBe("Estorno loja X");
    expect(refund.amount).toBe(150.5);
    expect(refund.refundDate).toEqual(base.refundDate);
    expect(refund.dueYear).toBe(2026);
    expect(refund.dueMonth).toBe(7);
    expect(refund.categoryId).toBeNull();
    expect(refund.source).toBe("MANUAL");
    expect(refund.createdAt).toBeInstanceOf(Date);
  });

  it("creates a refund with IMPORT source and a category", () => {
    const refund = createCreditCardRefund({ ...base, source: "IMPORT", categoryId: "cat-1" });
    expect(refund.source).toBe("IMPORT");
    expect(refund.categoryId).toBe("cat-1");
  });

  it("throws when amount is zero", () => {
    expect(() => createCreditCardRefund({ ...base, amount: 0 })).toThrow(
      "Amount must be positive",
    );
  });

  it("throws when amount is negative", () => {
    expect(() => createCreditCardRefund({ ...base, amount: -10 })).toThrow(
      "Amount must be positive",
    );
  });

  it("throws when description is empty", () => {
    expect(() => createCreditCardRefund({ ...base, description: "" })).toThrow(
      "Description is required",
    );
  });

  it("throws when description is only whitespace", () => {
    expect(() => createCreditCardRefund({ ...base, description: "   " })).toThrow(
      "Description is required",
    );
  });

  it("throws when creditCardId is missing", () => {
    expect(() => createCreditCardRefund({ ...base, creditCardId: "" })).toThrow(
      "Credit card is required",
    );
  });

  it("throws when personId is missing", () => {
    expect(() => createCreditCardRefund({ ...base, personId: "" })).toThrow(
      "Person is required",
    );
  });

  it("throws when refundDate is missing", () => {
    // @ts-expect-error testing runtime validation of a required field
    expect(() => createCreditCardRefund({ ...base, refundDate: null })).toThrow(
      "Refund date is required",
    );
  });
});
