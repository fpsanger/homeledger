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

  describe("reference range per 1k", () => {
    it("defaults both bounds to null", () => {
      const p = createLoyaltyProgram(base);
      expect(p.referenceMinPer1kBrl).toBeNull();
      expect(p.referenceMaxPer1kBrl).toBeNull();
    });

    it("accepts a range", () => {
      const p = createLoyaltyProgram({
        ...base,
        referenceMinPer1kBrl: 24,
        referenceMaxPer1kBrl: 26,
      });
      expect(p.referenceMinPer1kBrl).toBe(24);
      expect(p.referenceMaxPer1kBrl).toBe(26);
    });

    it("accepts a single bound", () => {
      const p = createLoyaltyProgram({ ...base, referenceMinPer1kBrl: 16 });
      expect(p.referenceMinPer1kBrl).toBe(16);
      expect(p.referenceMaxPer1kBrl).toBeNull();
    });

    it("rejects non-positive bounds", () => {
      expect(() => createLoyaltyProgram({ ...base, referenceMinPer1kBrl: 0 })).toThrow(
        "referenceMinPer1kBrl must be positive",
      );
      expect(() => createLoyaltyProgram({ ...base, referenceMaxPer1kBrl: -1 })).toThrow(
        "referenceMaxPer1kBrl must be positive",
      );
    });

    it("rejects min greater than max", () => {
      expect(() =>
        createLoyaltyProgram({ ...base, referenceMinPer1kBrl: 27, referenceMaxPer1kBrl: 26 }),
      ).toThrow("referenceMinPer1kBrl must not exceed referenceMaxPer1kBrl");
    });
  });
});
