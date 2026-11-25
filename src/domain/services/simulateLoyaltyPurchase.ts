export type PurchaseSimulationInput = {
  points: number;
  paidBrl: number;
  /** Points / cost left in FIFO lots (see LoyaltyFifoSummary). */
  currentLotsPoints: number;
  currentLotsCostBrl: number;
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
  avgRedeemValuePer1k: number | null;
};

export type ReferencePosition = "BELOW" | "WITHIN" | "ABOVE" | "NONE";

/**
 * GREAT: below the reference range. OK: inside it (or below the redemption average
 * when there is no range). CAUTION: cheap enough for the range but the average redemption
 * would not cover it. NOT_WORTH: above the range / not below the redemption average.
 * NO_REFERENCE: nothing to compare against.
 */
export type PurchaseVerdict = "GREAT" | "OK" | "CAUTION" | "NOT_WORTH" | "NO_REFERENCE";

export type PurchaseSimulation = {
  effectiveCostPer1k: number;
  currentCostPer1k: number | null;
  afterCostPer1k: number;
  vsCurrentBrl: number | null;
  vsCurrentPercent: number | null;
  referencePosition: ReferencePosition;
  /** Distance to the nearest range bound: negative below the low bound, positive above the high bound, 0 inside. */
  vsReferenceBrl: number | null;
  projectedRoiPercent: number | null;
  verdict: PurchaseVerdict;
};

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

type Range = { low: number; high: number };

function resolveRange(min: number | null, max: number | null): Range | null {
  const low = min ?? max;
  const high = max ?? min;
  return low === null || high === null ? null : { low, high };
}

function positionInRange(cost: number, range: Range | null): ReferencePosition {
  if (!range) return "NONE";
  if (cost < range.low) return "BELOW";
  if (cost > range.high) return "ABOVE";
  return "WITHIN";
}

function distanceToRange(cost: number, range: Range | null): number | null {
  if (!range) return null;
  if (cost < range.low) return cost - range.low;
  if (cost > range.high) return cost - range.high;
  return 0;
}

function decideVerdict(
  position: ReferencePosition,
  cost: number,
  avgRedeemValuePer1k: number | null,
): PurchaseVerdict {
  const notCoveredByRedemptions = avgRedeemValuePer1k !== null && cost >= avgRedeemValuePer1k;

  if (position === "NONE") {
    if (avgRedeemValuePer1k === null) return "NO_REFERENCE";
    return notCoveredByRedemptions ? "NOT_WORTH" : "OK";
  }
  if (position === "ABOVE") return "NOT_WORTH";
  if (notCoveredByRedemptions) return "CAUTION";
  return position === "BELOW" ? "GREAT" : "OK";
}

export function simulateLoyaltyPurchase(input: PurchaseSimulationInput): PurchaseSimulation | null {
  if (!isPositive(input.points) || !isPositive(input.paidBrl)) return null;

  const effectiveCostPer1k = (input.paidBrl / input.points) * 1000;
  const currentCostPer1k =
    input.currentLotsPoints > 0
      ? (input.currentLotsCostBrl / input.currentLotsPoints) * 1000
      : null;
  const afterCostPer1k =
    ((input.currentLotsCostBrl + input.paidBrl) / (input.currentLotsPoints + input.points)) * 1000;

  // Compare at displayed precision so R$ 16,004 is not flagged above a R$ 16 reference.
  const comparable = roundToCents(effectiveCostPer1k);
  const range = resolveRange(input.referenceMinPer1kBrl, input.referenceMaxPer1kBrl);
  const referencePosition = positionInRange(comparable, range);

  return {
    effectiveCostPer1k,
    currentCostPer1k,
    afterCostPer1k,
    vsCurrentBrl: currentCostPer1k === null ? null : effectiveCostPer1k - currentCostPer1k,
    vsCurrentPercent:
      currentCostPer1k === null || currentCostPer1k === 0
        ? null
        : ((effectiveCostPer1k - currentCostPer1k) / currentCostPer1k) * 100,
    referencePosition,
    vsReferenceBrl: distanceToRange(comparable, range),
    projectedRoiPercent:
      input.avgRedeemValuePer1k === null
        ? null
        : ((input.avgRedeemValuePer1k - effectiveCostPer1k) / effectiveCostPer1k) * 100,
    verdict: decideVerdict(referencePosition, comparable, input.avgRedeemValuePer1k),
  };
}
