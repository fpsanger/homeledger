import { createCreditCard } from "../../../src/domain/entities/CreditCard";

const baseFixed = {
  id: "card-1",
  name: "Nubank",
  closureType: "FIXED" as const,
  fixedClosureDay: 25,
  dueDayOfMonth: 10,
  alwaysNextMonth: false,
  closureNextMonth: false,
};

const baseVariable = {
  id: "card-2",
  name: "Itaú",
  closureType: "VARIABLE" as const,
  fixedClosureDay: null,
  dueDayOfMonth: 5,
  alwaysNextMonth: false,
  closureNextMonth: false,
};

describe("createCreditCard", () => {
  it("creates a FIXED card with all fields", () => {
    const card = createCreditCard(baseFixed);
    expect(card.id).toBe("card-1");
    expect(card.name).toBe("Nubank");
    expect(card.closureType).toBe("FIXED");
    expect(card.fixedClosureDay).toBe(25);
    expect(card.dueDayOfMonth).toBe(10);
    expect(card.alwaysNextMonth).toBe(false);
  });

  it("creates a VARIABLE card with null fixedClosureDay", () => {
    const card = createCreditCard(baseVariable);
    expect(card.closureType).toBe("VARIABLE");
    expect(card.fixedClosureDay).toBeNull();
  });

  it("throws when name is empty", () => {
    expect(() => createCreditCard({ ...baseFixed, name: "" })).toThrow("Name is required");
  });

  it("throws when name is only whitespace", () => {
    expect(() => createCreditCard({ ...baseFixed, name: "   " })).toThrow("Name is required");
  });

  it("throws when FIXED card has no fixedClosureDay", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: null }),
    ).toThrow("fixedClosureDay is required for FIXED cards");
  });

  it("throws when VARIABLE card has fixedClosureDay set", () => {
    expect(() =>
      createCreditCard({ ...baseVariable, fixedClosureDay: 15 }),
    ).toThrow("fixedClosureDay must be null for VARIABLE cards");
  });

  it("throws when fixedClosureDay is below 1", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: 0 }),
    ).toThrow("fixedClosureDay must be between 1 and 31");
  });

  it("throws when fixedClosureDay is above 31", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, fixedClosureDay: 32 }),
    ).toThrow("fixedClosureDay must be between 1 and 31");
  });

  it("throws when dueDayOfMonth is below 1", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, dueDayOfMonth: 0 }),
    ).toThrow("dueDayOfMonth must be between 1 and 31");
  });

  it("throws when dueDayOfMonth is above 31", () => {
    expect(() =>
      createCreditCard({ ...baseFixed, dueDayOfMonth: 32 }),
    ).toThrow("dueDayOfMonth must be between 1 and 31");
  });

  it("alwaysNextMonth defaults to false when false", () => {
    const card = createCreditCard(baseFixed);
    expect(card.alwaysNextMonth).toBe(false);
  });

  it("creates card with alwaysNextMonth true", () => {
    const card = createCreditCard({ ...baseFixed, alwaysNextMonth: true });
    expect(card.alwaysNextMonth).toBe(true);
  });
});
