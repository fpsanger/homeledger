import { createLoyaltyTransfer } from "../../../src/domain/entities/LoyaltyTransfer";

const base = {
  id: "transfer-1",
  fromProgramId: "prog-1",
  toProgramId: "prog-2",
  pointsSent: 10000,
  pointsReceived: 12000,
  costBrl: null,
  transferDate: new Date("2024-03-01"),
  personId: null,
  description: null,
};

describe("LoyaltyTransfer entity", () => {
  it("creates a valid transfer", () => {
    const t = createLoyaltyTransfer(base);
    expect(t.id).toBe("transfer-1");
    expect(t.pointsSent).toBe(10000);
    expect(t.pointsReceived).toBe(12000);
  });

  it("allows pointsReceived equal to pointsSent (no bonus)", () => {
    expect(() =>
      createLoyaltyTransfer({ ...base, pointsReceived: 10000 }),
    ).not.toThrow();
  });

  it("throws when pointsSent <= 0", () => {
    expect(() =>
      createLoyaltyTransfer({ ...base, pointsSent: 0 }),
    ).toThrow("pointsSent must be positive");
  });

  it("throws when pointsReceived < pointsSent", () => {
    expect(() =>
      createLoyaltyTransfer({ ...base, pointsReceived: 9000 }),
    ).toThrow("pointsReceived cannot be less than pointsSent");
  });

  it("allows costBrl when provided and > 0", () => {
    const t = createLoyaltyTransfer({ ...base, costBrl: 200 });
    expect(t.costBrl).toBe(200);
  });

  it("throws when costBrl is provided but <= 0", () => {
    expect(() =>
      createLoyaltyTransfer({ ...base, costBrl: 0 }),
    ).toThrow("costBrl must be positive");
  });

  it("allows costBrl to be null", () => {
    const t = createLoyaltyTransfer({ ...base, costBrl: null });
    expect(t.costBrl).toBeNull();
  });

  it("sets createdAt and updatedAt", () => {
    const t = createLoyaltyTransfer(base);
    expect(t.createdAt).toBeInstanceOf(Date);
    expect(t.updatedAt).toBeInstanceOf(Date);
  });
});
