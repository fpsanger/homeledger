import { createInstallments } from "../../../src/domain/services/InstallmentPurchase";

const basePurchase = {
  personId: "person-1",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-01-15"),
  description: "TV",
  categoryId: null,
};

describe("InstallmentPurchase service", () => {
  describe("createInstallments", () => {
    it("creates the correct number of installments", () => {
      const installments = createInstallments(basePurchase);

      expect(installments).toHaveLength(12);
    });

    it("each installment amount equals totalAmount divided by numberOfInstallments", () => {
      const installments = createInstallments(basePurchase);

      for (const inst of installments) {
        expect(inst.amount).toBe(100);
      }
    });

    it("first installment is due in the same month as the purchase", () => {
      const installments = createInstallments(basePurchase);

      expect(installments[0].dueYear).toBe(2026);
      expect(installments[0].dueMonth).toBe(1);
    });

    it("installments are numbered sequentially starting at 1", () => {
      const installments = createInstallments(basePurchase);

      installments.forEach((inst, index) => {
        expect(inst.installmentNumber).toBe(index + 1);
      });
    });

    it("due months advance correctly across the year", () => {
      const installments = createInstallments(basePurchase);

      expect(installments[0].dueMonth).toBe(1);
      expect(installments[5].dueMonth).toBe(6);
      expect(installments[11].dueMonth).toBe(12);
    });

    it("handles month rollover into next year", () => {
      const purchase = {
        ...basePurchase,
        purchaseDate: new Date("2026-11-01"),
        numberOfInstallments: 3,
      };

      const installments = createInstallments(purchase);

      expect(installments[0].dueYear).toBe(2026);
      expect(installments[0].dueMonth).toBe(11);
      expect(installments[1].dueYear).toBe(2026);
      expect(installments[1].dueMonth).toBe(12);
      expect(installments[2].dueYear).toBe(2027);
      expect(installments[2].dueMonth).toBe(1);
    });

    it("single installment purchase creates one installment for purchase month", () => {
      const purchase = { ...basePurchase, totalAmount: 500, numberOfInstallments: 1 };

      const installments = createInstallments(purchase);

      expect(installments).toHaveLength(1);
      expect(installments[0].amount).toBe(500);
      expect(installments[0].dueMonth).toBe(1);
    });

    it("all installments are linked to the same personId via the purchase", () => {
      const installments = createInstallments(basePurchase);

      for (const inst of installments) {
        expect(inst.personId).toBe("person-1");
      }
    });

    it("all installments start as not paid", () => {
      const installments = createInstallments(basePurchase);

      for (const inst of installments) {
        expect(inst.isPaid).toBe(false);
      }
    });

    it("throws when personId is missing", () => {
      expect(() => createInstallments({ ...basePurchase, personId: "" })).toThrow(
        "Person is required",
      );
    });

    it("throws when totalAmount is zero", () => {
      expect(() => createInstallments({ ...basePurchase, totalAmount: 0 })).toThrow(
        "Amount must be positive",
      );
    });

    it("throws when totalAmount is negative", () => {
      expect(() => createInstallments({ ...basePurchase, totalAmount: -100 })).toThrow(
        "Amount must be positive",
      );
    });

    it("throws when numberOfInstallments is less than 1", () => {
      expect(() => createInstallments({ ...basePurchase, numberOfInstallments: 0 })).toThrow(
        "Number of installments must be at least 1",
      );
    });

    it("allows categoryId to be null (optional)", () => {
      const installments = createInstallments({ ...basePurchase, categoryId: null });

      expect(installments[0].categoryId).toBeNull();
    });

    it("passes categoryId to all installments when provided", () => {
      const installments = createInstallments({ ...basePurchase, categoryId: "cat-electronics" });

      for (const inst of installments) {
        expect(inst.categoryId).toBe("cat-electronics");
      }
    });

    it("does not require workspace_id", () => {
      const installments = createInstallments(basePurchase);

      for (const inst of installments) {
        expect(inst).not.toHaveProperty("workspaceId");
        expect(inst).not.toHaveProperty("workspace_id");
      }
    });
  });
});
