import { computeLoyaltyFifo } from "../../../src/domain/services/LoyaltyFifo";
import type { LoyaltyTransactionRecord } from "../../../src/domain/repositories/ILoyaltyTransactionRepository";

function tx(overrides: Omit<Partial<LoyaltyTransactionRecord>, "date"> & { type: LoyaltyTransactionRecord["type"]; points: number; date: string }): LoyaltyTransactionRecord {
  return {
    id: overrides.id ?? "tx-" + Math.random(),
    programId: "prog-1",
    personId: null,
    transferId: null,
    description: null,
    expiresAt: null,
    costBrl: null,
    valueBrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
    date: new Date(overrides.date),
  };
}

describe("LoyaltyFifo service", () => {
  it("returns zero balance for empty program", () => {
    const result = computeLoyaltyFifo([]);
    expect(result.summary.currentBalance).toBe(0);
    expect(result.summary.totalInvested).toBe(0);
    expect(result.transactions).toHaveLength(0);
  });

  describe("PURCHASE → REDEEM", () => {
    it("computes correct costPer1kPoints and ROI on single lot redemption", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 200, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData).toBeDefined();
      expect(redeem.fifoData!.costBrl).toBeCloseTo(50); // 5000/10000 * 100
      expect(redeem.fifoData!.costPer1kPoints).toBeCloseTo(10); // 100/10000*1000
      expect(redeem.fifoData!.roi).toBeCloseTo(300); // (200 - 50) / 50 * 100
    });

    it("consumes multiple purchase lots in FIFO order", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 5000, costBrl: 50, date: "2024-01-01" }),
        tx({ type: "PURCHASE", points: 5000, costBrl: 100, date: "2024-02-01" }),
        tx({ type: "REDEEM", points: 8000, valueBrl: 400, date: "2024-03-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      // Consumes all 5000 from first lot (cost 50) + 3000 from second lot (cost 60)
      expect(redeem.fifoData!.costBrl).toBeCloseTo(110);
      expect(redeem.fifoData!.roi).toBeCloseTo((400 - 110) / 110 * 100);
    });

    it("tracks remaining balance after PURCHASE and REDEEM", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 3000, valueBrl: 150, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.currentBalance).toBe(7000);
    });
  });

  describe("EARN / BONUS", () => {
    it("adds balance without creating cost lots", () => {
      const transactions = [
        tx({ type: "EARN", points: 5000, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 250, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData!.costBrl).toBe(0);
      expect(redeem.fifoData!.roi).toBeNull(); // totalCostBrl = 0
    });

    it("BONUS adds balance without cost lot", () => {
      const transactions = [
        tx({ type: "BONUS", points: 2000, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 2000, valueBrl: 100, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData!.roi).toBeNull();
    });
  });

  describe("TRANSFER_OUT", () => {
    it("consumes FIFO lots on TRANSFER_OUT", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "TRANSFER_OUT", points: 5000, date: "2024-02-01", transferId: "t-1" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      expect(result.summary.currentBalance).toBe(5000);
      const out = result.transactions.find((t) => t.type === "TRANSFER_OUT")!;
      expect(out.fifoData!.costBrl).toBeCloseTo(50);
    });
  });

  describe("TRANSFER_IN", () => {
    it("TRANSFER_IN without costBrl adds balance only, no lot created", () => {
      const transactions = [
        tx({ type: "TRANSFER_IN", points: 5000, date: "2024-01-01", transferId: "t-1" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 200, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData!.costBrl).toBe(0);
      expect(redeem.fifoData!.roi).toBeNull();
    });

    it("TRANSFER_IN with costBrl creates lot that flows to redemptions", () => {
      const transactions = [
        tx({ type: "TRANSFER_IN", points: 5000, costBrl: 75, date: "2024-01-01", transferId: "t-1" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 200, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData!.costBrl).toBeCloseTo(75);
      expect(redeem.fifoData!.roi).toBeCloseTo((200 - 75) / 75 * 100);
    });
  });

  describe("EXPIRE", () => {
    it("consumes FIFO lots with value 0 and roi null", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "EXPIRE", points: 5000, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const expire = result.transactions.find((t) => t.type === "EXPIRE")!;
      expect(expire.fifoData!.costBrl).toBeCloseTo(50);
      expect(expire.fifoData!.roi).toBeNull();
      expect(result.summary.totalExpired).toBe(5000);
    });
  });

  describe("ADJUSTMENT", () => {
    it("positive ADJUSTMENT creates zero-cost lot", () => {
      const transactions = [
        tx({ type: "ADJUSTMENT", points: 1000, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 1000, valueBrl: 50, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      expect(redeem.fifoData!.costBrl).toBe(0);
      expect(redeem.fifoData!.roi).toBeNull();
    });

    it("negative ADJUSTMENT consumes FIFO lots", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "ADJUSTMENT", points: -3000, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      expect(result.summary.currentBalance).toBe(7000);
      const adj = result.transactions.find((t) => t.type === "ADJUSTMENT")!;
      expect(adj.fifoData!.costBrl).toBeCloseTo(30);
    });
  });

  describe("redemption exceeding purchased lots", () => {
    it("free points cover gap, cost basis for free portion is zero", () => {
      const transactions = [
        tx({ type: "EARN", points: 5000, date: "2024-01-01" }),
        tx({ type: "PURCHASE", points: 5000, costBrl: 50, date: "2024-02-01" }),
        tx({ type: "REDEEM", points: 8000, valueBrl: 400, date: "2024-03-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);

      const redeem = result.transactions.find((t) => t.type === "REDEEM")!;
      // consume all 5000 from PURCHASE lot ($50), then 3000 free points cover the gap ($0)
      expect(redeem.fifoData!.costBrl).toBeCloseTo(50);
    });
  });

  describe("summary", () => {
    it("computes totalInvested from PURCHASE and TRANSFER_IN with costBrl", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "TRANSFER_IN", points: 5000, costBrl: 50, date: "2024-02-01", transferId: "t-1" }),
        tx({ type: "TRANSFER_IN", points: 3000, date: "2024-03-01", transferId: "t-2" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.totalInvested).toBeCloseTo(150);
    });

    it("computes avgCostPer1kPoints", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.avgCostPer1kPoints).toBeCloseTo(10);
    });

    it("computes totalValueRedeemed", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 20000, costBrl: 200, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 10000, valueBrl: 500, date: "2024-02-01" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 300, date: "2024-03-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.totalValueRedeemed).toBe(800);
    });

    it("computes overallRoi", () => {
      const transactions = [
        tx({ type: "PURCHASE", points: 10000, costBrl: 100, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 10000, valueBrl: 300, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.overallRoi).toBeCloseTo(200); // (300-100)/100 * 100
    });

    it("roi is null when totalInvested is 0", () => {
      const transactions = [
        tx({ type: "EARN", points: 5000, date: "2024-01-01" }),
        tx({ type: "REDEEM", points: 5000, valueBrl: 200, date: "2024-02-01" }),
      ];
      const result = computeLoyaltyFifo(transactions);
      expect(result.summary.overallRoi).toBeNull();
    });
  });
});
