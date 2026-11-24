import type { LoyaltyTransactionType } from "../entities/LoyaltyTransaction";
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

export type TransferInfo = {
  pointsSent: number;
  pointsReceived: number;
  fromProgramName: string;
  toProgramName: string;
};

export type EnrichedTransaction = LoyaltyTransactionRecord & {
  fifoData?: FifoData;
  transfer?: TransferInfo;
};

export type LoyaltyFifoSummary = {
  currentBalance: number;
  totalInvested: number;
  totalPurchasedPoints: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
  /** Points still sitting in cost lots (free points without a lot are not counted). */
  currentLotsPoints: number;
  currentLotsCostBrl: number;
  /** Average cost per 1k of the lots left after FIFO consumption; null when no lots remain. */
  currentCostPer1kPoints: number | null;
  /** Weighted average BRL value obtained per 1k redeemed points; null when nothing was redeemed. */
  avgRedeemValuePer1k: number | null;
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
    const consumedCost = consumed * costPerPoint;
    totalCost += consumedCost;
    lot.costBrl -= consumedCost;
    lot.remainingPoints -= consumed;
    remaining -= consumed;
    if (lot.remainingPoints <= 0) lots.shift();
  }

  return totalCost;
}

type FifoState = {
  balance: number;
  totalInvested: number;
  totalPurchasedPoints: number;
  totalValueRedeemed: number;
  totalRedeemedPoints: number;
  totalExpired: number;
};

type TransactionHandler = (
  tx: LoyaltyTransactionRecord,
  lots: CostLot[],
  state: FifoState,
) => FifoData | undefined;

function applyPurchase(tx: LoyaltyTransactionRecord, lots: CostLot[], state: FifoState): undefined {
  state.balance += tx.points;
  state.totalInvested += tx.costBrl!;
  state.totalPurchasedPoints += tx.points;
  lots.push({ remainingPoints: tx.points, costBrl: tx.costBrl! });
  return undefined;
}

function applyEarnOrBonus(
  tx: LoyaltyTransactionRecord,
  _lots: CostLot[],
  state: FifoState,
): undefined {
  state.balance += tx.points;
  return undefined;
}

function applyTransferIn(
  tx: LoyaltyTransactionRecord,
  lots: CostLot[],
  state: FifoState,
): FifoData | undefined {
  state.balance += tx.points;
  if (tx.costBrl == null) return undefined;
  state.totalInvested += tx.costBrl;
  state.totalPurchasedPoints += tx.points;
  lots.push({ remainingPoints: tx.points, costBrl: tx.costBrl });
  const costPer1kPoints = tx.points > 0 ? (tx.costBrl / tx.points) * 1000 : 0;
  return { costBrl: tx.costBrl, costPer1kPoints, roi: null };
}

function applyAdjustment(
  tx: LoyaltyTransactionRecord,
  lots: CostLot[],
  state: FifoState,
): FifoData | undefined {
  if (tx.points > 0) {
    state.balance += tx.points;
    lots.push({ remainingPoints: tx.points, costBrl: 0 });
    return undefined;
  }
  const absPoints = Math.abs(tx.points);
  state.balance -= absPoints;
  const costBrl = consumeLots(lots, absPoints);
  const costPer1kPoints = absPoints > 0 ? (costBrl / absPoints) * 1000 : 0;
  return { costBrl, costPer1kPoints, roi: null };
}

function applyRedeem(tx: LoyaltyTransactionRecord, lots: CostLot[], state: FifoState): FifoData {
  state.balance -= tx.points;
  const costBrl = consumeLots(lots, tx.points);
  const costPer1kPoints = (costBrl / tx.points) * 1000;
  const roi = costBrl > 0 ? ((tx.valueBrl! - costBrl) / costBrl) * 100 : null;
  state.totalValueRedeemed += tx.valueBrl!;
  state.totalRedeemedPoints += tx.points;
  return { costBrl, costPer1kPoints, roi };
}

function applyTransferOut(
  tx: LoyaltyTransactionRecord,
  lots: CostLot[],
  state: FifoState,
): FifoData {
  state.balance -= tx.points;
  const costBrl = consumeLots(lots, tx.points);
  const costPer1kPoints = (costBrl / tx.points) * 1000;
  return { costBrl, costPer1kPoints, roi: null };
}

function applyExpire(tx: LoyaltyTransactionRecord, lots: CostLot[], state: FifoState): FifoData {
  state.balance -= tx.points;
  const costBrl = consumeLots(lots, tx.points);
  const costPer1kPoints = (costBrl / tx.points) * 1000;
  state.totalExpired += tx.points;
  return { costBrl, costPer1kPoints, roi: null };
}

const TRANSACTION_HANDLERS: Record<LoyaltyTransactionType, TransactionHandler> = {
  PURCHASE: applyPurchase,
  EARN: applyEarnOrBonus,
  BONUS: applyEarnOrBonus,
  TRANSFER_IN: applyTransferIn,
  ADJUSTMENT: applyAdjustment,
  REDEEM: applyRedeem,
  TRANSFER_OUT: applyTransferOut,
  EXPIRE: applyExpire,
};

function buildSummary(state: FifoState, lots: CostLot[]): LoyaltyFifoSummary {
  const currentLotsPoints = lots.reduce((sum, lot) => sum + lot.remainingPoints, 0);
  const currentLotsCostBrl = lots.reduce((sum, lot) => sum + lot.costBrl, 0);

  return {
    currentBalance: state.balance,
    totalInvested: state.totalInvested,
    totalPurchasedPoints: state.totalPurchasedPoints,
    avgCostPer1kPoints:
      state.totalPurchasedPoints > 0
        ? (state.totalInvested / state.totalPurchasedPoints) * 1000
        : 0,
    totalValueRedeemed: state.totalValueRedeemed,
    totalExpired: state.totalExpired,
    overallRoi:
      state.totalInvested > 0
        ? ((state.totalValueRedeemed - state.totalInvested) / state.totalInvested) * 100
        : null,
    currentLotsPoints,
    currentLotsCostBrl,
    currentCostPer1kPoints:
      currentLotsPoints > 0 ? (currentLotsCostBrl / currentLotsPoints) * 1000 : null,
    avgRedeemValuePer1k:
      state.totalRedeemedPoints > 0
        ? (state.totalValueRedeemed / state.totalRedeemedPoints) * 1000
        : null,
  };
}

export function computeLoyaltyFifo(transactions: LoyaltyTransactionRecord[]): LoyaltyFifoResult {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  const lots: CostLot[] = [];
  const state: FifoState = {
    balance: 0,
    totalInvested: 0,
    totalPurchasedPoints: 0,
    totalValueRedeemed: 0,
    totalRedeemedPoints: 0,
    totalExpired: 0,
  };

  const enriched: EnrichedTransaction[] = [];

  for (const tx of sorted) {
    const fifoData = TRANSACTION_HANDLERS[tx.type](tx, lots, state);
    enriched.push(fifoData !== undefined ? { ...tx, fifoData } : tx);
  }

  return { summary: buildSummary(state, lots), transactions: enriched };
}
