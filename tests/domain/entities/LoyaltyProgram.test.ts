import { createLoyaltyProgram } from "../../../src/domain/entities/LoyaltyProgram";

const base = {
  id: "prog-1",
  name: "LATAM Pass",
  type: "AIRLINE" as const,
  color: "#E31837",
};

describe("LoyaltyProgram entity", () => {
  it("creates a valid program", () => {
    const p = createLoyaltyProgram(base);
    expect(p.id).toBe("prog-1");
    expect(p.name).toBe("LATAM Pass");
    expect(p.type).toBe("AIRLINE");
    expect(p.color).toBe("#E31837");
  });

  it("trims whitespace from name", () => {
    const p = createLoyaltyProgram({ ...base, name: "  Smiles  " });
    expect(p.name).toBe("Smiles");
  });

  it("throws when name is empty", () => {
    expect(() => createLoyaltyProgram({ ...base, name: "" })).toThrow("Name is required");
  });

  it("throws when name is only whitespace", () => {
    expect(() => createLoyaltyProgram({ ...base, name: "   " })).toThrow("Name is required");
  });

  it("throws when color is empty", () => {
    expect(() => createLoyaltyProgram({ ...base, color: "" })).toThrow("Color is required");
  });

  it("accepts all valid program types", () => {
    for (const type of ["AIRLINE", "HOTEL", "BANK", "OTHER"] as const) {
      expect(() => createLoyaltyProgram({ ...base, type })).not.toThrow();
    }
  });

  it("sets createdAt and updatedAt", () => {
    const p = createLoyaltyProgram(base);
    expect(p.createdAt).toBeInstanceOf(Date);
    expect(p.updatedAt).toBeInstanceOf(Date);
  });
});
