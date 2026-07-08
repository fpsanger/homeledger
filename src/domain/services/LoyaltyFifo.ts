import type { LoyaltyTransactionRecord } from "../repositories/ILoyaltyTransactionRepository";

type CostLot = {
  remainingPoints: number;
  costBrl: number;
};

export type FifoData = {
  costBrl: number;
  costPer1kPoints: number;
  roi: number | null;
};

export type EnrichedTransaction = LoyaltyTransactionRecord & {
  fifoData?: FifoData;
};

export type LoyaltyFifoSummary = {
  currentBalance: number;
  totalInvested: number;
  totalPurchasedPoints: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
};

export type LoyaltyFifoResult = {
  summary: LoyaltyFifoSummary;
  transactions: EnrichedTransaction[];
};

function consumeLots(lots: CostLot[], points: number): number {
  let remaining = points;
  let totalCost = 0;

  while (remaining > 0 && lots.length > 0) {
    const lot = lots[0];
    const consumed = Math.min(lot.remainingPoints, remaining);
    const costPerPoint = lot.remainingPoints > 0 ? lot.costBrl / lot.remainingPoints : 0;
    totalCost += consumed * costPerPoint;
    lot.remainingPoints -= consumed;
    remaining -= consumed;
    if (lot.remainingPoints <= 0) lots.shift();
  }

  return totalCost;
}

export function computeLoyaltyFifo(transactions: LoyaltyTransactionRecord[]): LoyaltyFifoResult {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  const lots: CostLot[] = [];
  let balance = 0;
  let totalInvested = 0;
  let totalPurchasedPoints = 0;
  let totalValueRedeemed = 0;
  let totalExpired = 0;

  const enriched: EnrichedTransaction[] = [];

  for (const tx of sorted) {
    let fifoData: FifoData | undefined;

    switch (tx.type) {
      case "PURCHASE":
        balance += tx.points;
        totalInvested += tx.costBrl!;
        totalPurchasedPoints += tx.points;
        lots.push({ remainingPoints: tx.points, costBrl: tx.costBrl! });
        break;

      case "EARN":
      case "BONUS":
        balance += tx.points;
        break;

      case "TRANSFER_IN":
        balance += tx.points;
        if (tx.costBrl != null) {
          totalInvested += tx.costBrl;
          totalPurchasedPoints += tx.points;
          lots.push({ remainingPoints: tx.points, costBrl: tx.costBrl });
          const costPer1kPoints = tx.points > 0 ? (tx.costBrl / tx.points) * 1000 : 0;
          fifoData = { costBrl: tx.costBrl, costPer1kPoints, roi: null };
        }
        break;

      case "ADJUSTMENT":
        if (tx.points > 0) {
          balance += tx.points;
          lots.push({ remainingPoints: tx.points, costBrl: 0 });
        } else {
          const absPoints = Math.abs(tx.points);
          balance -= absPoints;
          const costBrl = consumeLots(lots, absPoints);
          const costPer1kPoints = absPoints > 0 ? (costBrl / absPoints) * 1000 : 0;
          fifoData = { costBrl, costPer1kPoints, roi: null };
        }
        break;

      case "REDEEM": {
        balance -= tx.points;
        const costBrl = consumeLots(lots, tx.points);
        const costPer1kPoints = (costBrl / tx.points) * 1000;
        const roi = costBrl > 0 ? ((tx.valueBrl! - costBrl) / costBrl) * 100 : null;
        totalValueRedeemed += tx.valueBrl!;
        fifoData = { costBrl, costPer1kPoints, roi };
        break;
      }

      case "TRANSFER_OUT": {
        balance -= tx.points;
        const costBrl = consumeLots(lots, tx.points);
        const costPer1kPoints = (costBrl / tx.points) * 1000;
        fifoData = { costBrl, costPer1kPoints, roi: null };
        break;
      }

      case "EXPIRE": {
        balance -= tx.points;
        const costBrl = consumeLots(lots, tx.points);
        const costPer1kPoints = (costBrl / tx.points) * 1000;
        totalExpired += tx.points;
        fifoData = { costBrl, costPer1kPoints, roi: null };
        break;
      }
    }

    enriched.push(fifoData !== undefined ? { ...tx, fifoData } : tx);
  }

  const avgCostPer1kPoints = totalPurchasedPoints > 0 ? (totalInvested / totalPurchasedPoints) * 1000 : 0;
  const overallRoi = totalInvested > 0 ? ((totalValueRedeemed - totalInvested) / totalInvested) * 100 : null;

  return {
    summary: {
      currentBalance: balance,
      totalInvested,
      totalPurchasedPoints,
      avgCostPer1kPoints,
      totalValueRedeemed,
      totalExpired,
      overallRoi,
    },
    transactions: enriched,
  };
}
