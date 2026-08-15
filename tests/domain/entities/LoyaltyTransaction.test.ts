import { createLoyaltyTransaction } from "../../../src/domain/entities/LoyaltyTransaction";

const base = {
  id: "tx-1",
  programId: "prog-1",
  personId: null,
  transferId: null,
  date: new Date("2024-01-15"),
  description: null,
  expiresAt: null,
  costBrl: null,
  valueBrl: null,
};

describe("LoyaltyTransaction entity", () => {
  describe("PURCHASE", () => {
    it("creates a valid PURCHASE transaction", () => {
      const tx = createLoyaltyTransaction({
        ...base,
        type: "PURCHASE",
        points: 10000,
        costBrl: 150,
      });
      expect(tx.type).toBe("PURCHASE");
      expect(tx.points).toBe(10000);
      expect(tx.costBrl).toBe(150);
    });

    it("throws when PURCHASE has no costBrl", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "PURCHASE", points: 10000, costBrl: null }),
      ).toThrow("PURCHASE requires costBrl");
    });

    it("throws when PURCHASE costBrl <= 0", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "PURCHASE", points: 10000, costBrl: 0 }),
      ).toThrow("PURCHASE requires costBrl");
    });

    it("throws when PURCHASE points <= 0", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "PURCHASE", points: 0, costBrl: 150 }),
      ).toThrow("points must be positive");
    });
  });

  describe("EARN", () => {
    it("creates a valid EARN transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "EARN", points: 5000 });
      expect(tx.type).toBe("EARN");
      expect(tx.points).toBe(5000);
    });

    it("throws when EARN points <= 0", () => {
      expect(() => createLoyaltyTransaction({ ...base, type: "EARN", points: 0 })).toThrow(
        "points must be positive",
      );
    });
  });

  describe("BONUS", () => {
    it("creates a valid BONUS transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "BONUS", points: 2000 });
      expect(tx.type).toBe("BONUS");
    });

    it("throws when BONUS points <= 0", () => {
      expect(() => createLoyaltyTransaction({ ...base, type: "BONUS", points: 0 })).toThrow(
        "points must be positive",
      );
    });
  });

  describe("REDEEM", () => {
    it("creates a valid REDEEM transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "REDEEM", points: 20000 });
      expect(tx.type).toBe("REDEEM");
      expect(tx.valueBrl).toBeNull();
    });

    it("throws when REDEEM points <= 0", () => {
      expect(() => createLoyaltyTransaction({ ...base, type: "REDEEM", points: 0 })).toThrow(
        "points must be positive",
      );
    });
  });

  describe("TRANSFER_OUT", () => {
    it("creates a valid TRANSFER_OUT transaction", () => {
      const tx = createLoyaltyTransaction({
        ...base,
        type: "TRANSFER_OUT",
        points: 5000,
        transferId: "transfer-1",
      });
      expect(tx.type).toBe("TRANSFER_OUT");
      expect(tx.transferId).toBe("transfer-1");
    });

    it("throws when TRANSFER_OUT has no transferId", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "TRANSFER_OUT", points: 5000, transferId: null }),
      ).toThrow("TRANSFER_OUT requires transferId");
    });

    it("throws when TRANSFER_OUT points <= 0", () => {
      expect(() =>
        createLoyaltyTransaction({
          ...base,
          type: "TRANSFER_OUT",
          points: 0,
          transferId: "transfer-1",
        }),
      ).toThrow("points must be positive");
    });
  });

  describe("TRANSFER_IN", () => {
    it("creates a valid TRANSFER_IN transaction without costBrl", () => {
      const tx = createLoyaltyTransaction({
        ...base,
        type: "TRANSFER_IN",
        points: 6000,
        transferId: "transfer-1",
      });
      expect(tx.type).toBe("TRANSFER_IN");
      expect(tx.costBrl).toBeNull();
    });

    it("creates a valid TRANSFER_IN transaction with costBrl", () => {
      const tx = createLoyaltyTransaction({
        ...base,
        type: "TRANSFER_IN",
        points: 6000,
        transferId: "transfer-1",
        costBrl: 100,
      });
      expect(tx.costBrl).toBe(100);
    });

    it("throws when TRANSFER_IN has no transferId", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "TRANSFER_IN", points: 6000, transferId: null }),
      ).toThrow("TRANSFER_IN requires transferId");
    });

    it("throws when TRANSFER_IN points <= 0", () => {
      expect(() =>
        createLoyaltyTransaction({
          ...base,
          type: "TRANSFER_IN",
          points: 0,
          transferId: "transfer-1",
        }),
      ).toThrow("points must be positive");
    });
  });

  describe("EXPIRE", () => {
    it("creates a valid EXPIRE transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "EXPIRE", points: 3000 });
      expect(tx.type).toBe("EXPIRE");
    });

    it("throws when EXPIRE points <= 0", () => {
      expect(() => createLoyaltyTransaction({ ...base, type: "EXPIRE", points: 0 })).toThrow(
        "points must be positive",
      );
    });
  });

  describe("ADJUSTMENT", () => {
    it("creates a valid positive ADJUSTMENT transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "ADJUSTMENT", points: 500 });
      expect(tx.points).toBe(500);
    });

    it("creates a valid negative ADJUSTMENT transaction", () => {
      const tx = createLoyaltyTransaction({ ...base, type: "ADJUSTMENT", points: -500 });
      expect(tx.points).toBe(-500);
    });

    it("allows zero points for ADJUSTMENT", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "ADJUSTMENT", points: 0 }),
      ).not.toThrow();
    });
  });

  describe("transferId constraints", () => {
    it("throws when non-transfer type has a transferId", () => {
      expect(() =>
        createLoyaltyTransaction({ ...base, type: "EARN", points: 1000, transferId: "transfer-1" }),
      ).toThrow("transferId must be null for non-transfer types");
    });

    it("throws when PURCHASE has a transferId", () => {
      expect(() =>
        createLoyaltyTransaction({
          ...base,
          type: "PURCHASE",
          points: 1000,
          costBrl: 100,
          transferId: "transfer-1",
        }),
      ).toThrow("transferId must be null for non-transfer types");
    });
  });
});
