import {
  type PurchaseSimulationInput,
  simulateLoyaltyPurchase,
} from "../../../src/domain/services/simulateLoyaltyPurchase";

const base: PurchaseSimulationInput = {
  points: 10000,
  paidBrl: 200, // R$ 20 / 1k
  currentLotsPoints: 10000,
  currentLotsCostBrl: 150, // R$ 15 / 1k
  referenceMinPer1kBrl: 24,
  referenceMaxPer1kBrl: 26,
  avgRedeemValuePer1k: null,
};

function simulate(overrides: Partial<PurchaseSimulationInput> = {}) {
  return simulateLoyaltyPurchase({ ...base, ...overrides });
}

describe("simulateLoyaltyPurchase", () => {
  describe("invalid input", () => {
    it.each([
      ["zero points", { points: 0 }],
      ["negative points", { points: -1 }],
      ["zero price", { paidBrl: 0 }],
      ["negative price", { paidBrl: -5 }],
      ["NaN price", { paidBrl: Number.NaN }],
    ])("returns null for %s", (_label, overrides) => {
      expect(simulate(overrides)).toBeNull();
    });
  });

  describe("costs", () => {
    it("computes effective cost per 1k", () => {
      expect(simulate()!.effectiveCostPer1k).toBeCloseTo(20);
    });

    it("blends the new lot into the current lots for the after-average", () => {
      // (150 + 200) / (10000 + 10000) * 1000 = 17.5
      expect(simulate()!.afterCostPer1k).toBeCloseTo(17.5);
    });

    it("compares against the current lots average", () => {
      const result = simulate()!;
      expect(result.currentCostPer1k).toBeCloseTo(15);
      expect(result.vsCurrentBrl).toBeCloseTo(5);
      expect(result.vsCurrentPercent).toBeCloseTo(33.333, 2);
    });

    it("has no current comparison when there are no lots", () => {
      const result = simulate({ currentLotsPoints: 0, currentLotsCostBrl: 0 })!;
      expect(result.currentCostPer1k).toBeNull();
      expect(result.vsCurrentBrl).toBeNull();
      expect(result.vsCurrentPercent).toBeNull();
      expect(result.afterCostPer1k).toBeCloseTo(20);
    });
  });

  describe("reference range", () => {
    it("is GREAT when below the range", () => {
      const result = simulate({ paidBrl: 200 })!; // 20 < 24
      expect(result.referencePosition).toBe("BELOW");
      expect(result.verdict).toBe("GREAT");
      expect(result.vsReferenceBrl).toBeCloseTo(-4); // vs low bound
    });

    it("is OK inside the range, bounds included", () => {
      expect(simulate({ paidBrl: 240 })!.verdict).toBe("OK");
      expect(simulate({ paidBrl: 260 })!.verdict).toBe("OK");
      const mid = simulate({ paidBrl: 250 })!;
      expect(mid.referencePosition).toBe("WITHIN");
      expect(mid.vsReferenceBrl).toBe(0);
    });

    it("is NOT_WORTH above the range", () => {
      const result = simulate({ paidBrl: 280 })!; // 28 > 26
      expect(result.referencePosition).toBe("ABOVE");
      expect(result.verdict).toBe("NOT_WORTH");
      expect(result.vsReferenceBrl).toBeCloseTo(2); // vs high bound
    });

    it("compares at displayed precision (cents) so 16.004 is not above 16", () => {
      const result = simulate({
        points: 1000,
        paidBrl: 16.004,
        referenceMinPer1kBrl: 16,
        referenceMaxPer1kBrl: null,
      })!;
      expect(result.referencePosition).toBe("WITHIN");
    });

    it("treats a single min as a fixed reference point", () => {
      const only = { referenceMinPer1kBrl: 16, referenceMaxPer1kBrl: null };
      expect(simulate({ ...only, paidBrl: 150 })!.verdict).toBe("GREAT");
      expect(simulate({ ...only, paidBrl: 160 })!.verdict).toBe("OK");
      expect(simulate({ ...only, paidBrl: 170 })!.verdict).toBe("NOT_WORTH");
    });

    it("treats a single max as a fixed reference point", () => {
      const only = { referenceMinPer1kBrl: null, referenceMaxPer1kBrl: 16 };
      expect(simulate({ ...only, paidBrl: 160 })!.verdict).toBe("OK");
      expect(simulate({ ...only, paidBrl: 170 })!.verdict).toBe("NOT_WORTH");
    });
  });

  describe("redemption average", () => {
    it("projects ROI against the average redemption value", () => {
      const result = simulate({ avgRedeemValuePer1k: 30 })!; // cost 20
      expect(result.projectedRoiPercent).toBeCloseTo(50);
    });

    it("has no projected ROI without redemptions", () => {
      expect(simulate()!.projectedRoiPercent).toBeNull();
    });

    it("downgrades to CAUTION when cost is within range but not below the redemption average", () => {
      const result = simulate({ paidBrl: 250, avgRedeemValuePer1k: 24 })!; // cost 25 >= 24
      expect(result.referencePosition).toBe("WITHIN");
      expect(result.verdict).toBe("CAUTION");
    });

    it("downgrades GREAT to CAUTION when cost is not below the redemption average", () => {
      const result = simulate({ paidBrl: 200, avgRedeemValuePer1k: 20 })!; // cost 20 >= 20
      expect(result.verdict).toBe("CAUTION");
    });

    it("keeps NOT_WORTH when above the range even if redemptions are generous", () => {
      expect(simulate({ paidBrl: 280, avgRedeemValuePer1k: 40 })!.verdict).toBe("NOT_WORTH");
    });
  });

  describe("without a reference range", () => {
    const noRange = { referenceMinPer1kBrl: null, referenceMaxPer1kBrl: null };

    it("is NO_REFERENCE with neither range nor redemptions", () => {
      const result = simulate(noRange)!;
      expect(result.referencePosition).toBe("NONE");
      expect(result.vsReferenceBrl).toBeNull();
      expect(result.verdict).toBe("NO_REFERENCE");
    });

    it("is OK when below the redemption average", () => {
      expect(simulate({ ...noRange, avgRedeemValuePer1k: 30 })!.verdict).toBe("OK");
    });

    it("is NOT_WORTH when not below the redemption average", () => {
      expect(simulate({ ...noRange, avgRedeemValuePer1k: 20 })!.verdict).toBe("NOT_WORTH");
      expect(simulate({ ...noRange, avgRedeemValuePer1k: 15 })!.verdict).toBe("NOT_WORTH");
    });
  });
});
