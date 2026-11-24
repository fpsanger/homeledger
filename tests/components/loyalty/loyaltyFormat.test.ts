import {
  buildBonusBreakdown,
  describeTransferInCost,
  formatReferenceRange,
  type Transaction,
  transferBonusPercent,
  transferPointsLabel,
} from "@/components/loyalty/loyaltyFormat";

const TRANSFER = {
  pointsSent: 0,
  pointsReceived: 0,
  fromProgramName: "Livelo",
  toProgramName: "LATAM Pass",
};

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
    transfer: { ...TRANSFER, pointsSent: 30000, pointsReceived: 38100 },
    ...overrides,
  };
}

describe("transferBonusPercent", () => {
  it("returns the bonus percentage of a bonus transfer-in", () => {
    expect(transferBonusPercent(tx({}))).toBe(27);
  });

  it("returns null when there is no bonus", () => {
    expect(
      transferBonusPercent(
        tx({ transfer: { ...TRANSFER, pointsSent: 1000, pointsReceived: 1000 } }),
      ),
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
      tx({
        costBrl: 100,
        points: 1000,
        transfer: { ...TRANSFER, pointsSent: 1000, pointsReceived: 1000 },
      }),
      false,
    );

    expect(result).toMatchObject({ kind: "value" });
    expect(result && "originText" in result ? result.originText : undefined).toBeUndefined();
  });

  it("returns 'unknown' when the inherited cost is null", () => {
    expect(describeTransferInCost(tx({ costBrl: null }), false)).toEqual({ kind: "unknown" });
  });
});

describe("buildBonusBreakdown", () => {
  it("splits a 10k transfer with 20% bonus into transferred points and bonus points", () => {
    const result = buildBonusBreakdown(
      tx({ points: 12000, transfer: { ...TRANSFER, pointsSent: 10000, pointsReceived: 12000 } }),
    );

    expect(result).toEqual({
      transferredPoints: 10000,
      bonusPoints: 2000,
      bonusPercent: 20,
      fromProgramName: "Livelo",
    });
  });

  it("returns null when there is no bonus, no transfer data or the type is not transfer-in", () => {
    expect(
      buildBonusBreakdown(
        tx({ transfer: { ...TRANSFER, pointsSent: 1000, pointsReceived: 1000 } }),
      ),
    ).toBeNull();
    expect(buildBonusBreakdown(tx({ transfer: undefined }))).toBeNull();
    expect(buildBonusBreakdown(tx({ type: "TRANSFER_OUT" }))).toBeNull();
  });
});

describe("transferPointsLabel", () => {
  it("shows only the transferred points when the transfer carries a bonus", () => {
    expect(
      transferPointsLabel(
        tx({ points: 12000, transfer: { ...TRANSFER, pointsSent: 10000, pointsReceived: 12000 } }),
      ),
    ).toBe("+10.000");
  });

  it("falls back to the regular signed points otherwise", () => {
    expect(
      transferPointsLabel(
        tx({ points: 1000, transfer: { ...TRANSFER, pointsSent: 1000, pointsReceived: 1000 } }),
      ),
    ).toBe("+1.000");
    expect(transferPointsLabel(tx({ type: "REDEEM", points: 500, transfer: undefined }))).toBe(
      "-500",
    );
  });
});

describe("formatReferenceRange", () => {
  // toLocaleString uses a non-breaking space after "R$".
  const plain = (value: string | null) => value?.replace(/\u00a0/g, " ") ?? null;

  it("formats a range", () => {
    expect(plain(formatReferenceRange(24, 26))).toBe("R$ 24,00 – R$ 26,00");
  });

  it("formats a single bound as a fixed value", () => {
    expect(plain(formatReferenceRange(16, null))).toBe("R$ 16,00");
    expect(plain(formatReferenceRange(null, 16))).toBe("R$ 16,00");
    expect(plain(formatReferenceRange(16, 16))).toBe("R$ 16,00");
  });

  it("returns null when nothing is set", () => {
    expect(formatReferenceRange(null, null)).toBeNull();
  });
});
