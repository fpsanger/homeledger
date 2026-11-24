import {
  describeTransferInCost,
  type Transaction,
  transferBonusPercent,
} from "@/components/loyalty/loyaltyFormat";

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    type: "TRANSFER_IN",
    points: 38100,
    date: "2026-11-23T12:00:00.000Z",
    description: null,
    expiresAt: null,
    costBrl: 857.6,
    valueBrl: null,
    transferId: "tr1",
    personId: null,
    transfer: { pointsSent: 30000, pointsReceived: 38100 },
    ...overrides,
  };
}

describe("transferBonusPercent", () => {
  it("returns the bonus percentage of a bonus transfer-in", () => {
    expect(transferBonusPercent(tx({}))).toBe(27);
  });

  it("returns null when there is no bonus", () => {
    expect(
      transferBonusPercent(tx({ transfer: { pointsSent: 1000, pointsReceived: 1000 } })),
    ).toBeNull();
  });

  it("returns null for non transfer-in types or missing transfer data", () => {
    expect(transferBonusPercent(tx({ type: "TRANSFER_OUT" }))).toBeNull();
    expect(transferBonusPercent(tx({ type: "PURCHASE" }))).toBeNull();
    expect(transferBonusPercent(tx({ transfer: undefined }))).toBeNull();
  });
});

describe("describeTransferInCost", () => {
  it("returns null for non transfer-in types", () => {
    expect(describeTransferInCost(tx({ type: "PURCHASE" }), false)).toBeNull();
  });

  it("flags a zero inherited cost as 'none'", () => {
    expect(describeTransferInCost(tx({ costBrl: 0 }), false)).toEqual({ kind: "none" });
  });

  it("returns the cost per 1k and the origin cost per 1k for a bonus transfer", () => {
    const result = describeTransferInCost(tx({}), false);

    expect(result?.kind).toBe("value");
    if (result?.kind !== "value") throw new Error("expected value");
    expect(result.text).toContain("22,51");
    expect(result.originText).toContain("28,59");
  });

  it("omits originText when there is no bonus", () => {
    const result = describeTransferInCost(
      tx({ costBrl: 100, points: 1000, transfer: { pointsSent: 1000, pointsReceived: 1000 } }),
      false,
    );

    expect(result).toMatchObject({ kind: "value" });
    expect(result && "originText" in result ? result.originText : undefined).toBeUndefined();
  });

  it("returns 'unknown' when the inherited cost is null", () => {
    expect(describeTransferInCost(tx({ costBrl: null }), false)).toEqual({ kind: "unknown" });
  });
});
