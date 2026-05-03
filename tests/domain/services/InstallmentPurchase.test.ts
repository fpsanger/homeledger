import {
  cancelInstallmentPurchase,
  createInstallmentPurchase,
  createInstallments,
} from "../../../src/domain/services/InstallmentPurchase";

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

    it("rounding difference goes to last installment so total amount is preserved", () => {
      const installments = createInstallments({
        ...basePurchase,
        totalAmount: 100,
        numberOfInstallments: 3,
      });

      expect(installments[0].amount).toBe(33.33);
      expect(installments[1].amount).toBe(33.33);
      expect(installments[2].amount).toBe(33.34);

      const total = installments.reduce((acc, inst) => acc + inst.amount, 0);
      expect(total).toBeCloseTo(100, 10);
    });
  });

  describe("createInstallmentPurchase", () => {
    const basePurchaseWithId = {
      id: "purchase-1",
      ...basePurchase,
    };

    it("returns a purchase draft and linked installments", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      expect(result.purchase).toBeDefined();
      expect(result.installments).toBeDefined();
    });

    it("purchase draft contains the provided id and fields", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      expect(result.purchase.id).toBe("purchase-1");
      expect(result.purchase.personId).toBe("person-1");
      expect(result.purchase.totalAmount).toBe(1200);
      expect(result.purchase.numberOfInstallments).toBe(12);
    });

    it("all installments are linked to the purchase via creditCardPurchaseId", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      for (const inst of result.installments) {
        expect(inst.creditCardPurchaseId).toBe("purchase-1");
      }
    });

    it("all installments are linked to the same person", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      for (const inst of result.installments) {
        expect(inst.personId).toBe("person-1");
      }
    });

    it("throws when numberOfInstallments is 1", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, numberOfInstallments: 1 }),
      ).toThrow("Number of installments must be greater than 1");
    });

    it("throws when numberOfInstallments is less than 1", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, numberOfInstallments: 0 }),
      ).toThrow("Number of installments must be greater than 1");
    });

    it("throws when personId is missing", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, personId: "" }),
      ).toThrow("Person is required");
    });

    it("throws when totalAmount is not positive", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, totalAmount: 0 }),
      ).toThrow("Amount must be positive");
    });

    it("generates correct installment count", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      expect(result.installments).toHaveLength(12);
    });

    it("each installment has sequential installment_number starting at 1", () => {
      const result = createInstallmentPurchase(basePurchaseWithId);

      result.installments.forEach((inst, index) => {
        expect(inst.installmentNumber).toBe(index + 1);
      });
    });

    it("each installment has due_month set correctly", () => {
      const result = createInstallmentPurchase({
        ...basePurchaseWithId,
        purchaseDate: new Date("2026-03-01"),
        numberOfInstallments: 3,
        totalAmount: 300,
      });

      expect(result.installments[0].dueMonth).toBe(3);
      expect(result.installments[1].dueMonth).toBe(4);
      expect(result.installments[2].dueMonth).toBe(5);
    });

    it("rounding difference is absorbed by last installment", () => {
      const result = createInstallmentPurchase({
        ...basePurchaseWithId,
        totalAmount: 100,
        numberOfInstallments: 3,
      });

      const total = result.installments.reduce((acc, inst) => acc + inst.amount, 0);
      expect(total).toBeCloseTo(100, 10);
      expect(result.installments[0].amount).toBe(33.33);
      expect(result.installments[2].amount).toBe(33.34);
    });
  });

  describe("cancelInstallmentPurchase", () => {
    const makeInstallmentDraft = (overrides = {}) => ({
      personId: "person-1",
      installmentNumber: 1,
      amount: 100,
      dueYear: 2026,
      dueMonth: 5,
      isPaid: false,
      isCanceled: false,
      categoryId: null,
      ...overrides,
    });

    it("marks all installments as canceled", () => {
      const installments = [makeInstallmentDraft({ installmentNumber: 1 }), makeInstallmentDraft({ installmentNumber: 2 })];

      const canceled = cancelInstallmentPurchase(installments);

      for (const inst of canceled) {
        expect(inst.isCanceled).toBe(true);
      }
    });

    it("cancels all installments regardless of paid status", () => {
      const installments = [
        makeInstallmentDraft({ isPaid: true }),
        makeInstallmentDraft({ isPaid: false }),
      ];

      const canceled = cancelInstallmentPurchase(installments);

      expect(canceled).toHaveLength(2);
      for (const inst of canceled) {
        expect(inst.isCanceled).toBe(true);
      }
    });

    it("preserves all original installment fields after cancellation", () => {
      const installments = [makeInstallmentDraft({ installmentNumber: 3, amount: 150, dueMonth: 7 })];

      const canceled = cancelInstallmentPurchase(installments);

      expect(canceled[0].installmentNumber).toBe(3);
      expect(canceled[0].amount).toBe(150);
      expect(canceled[0].dueMonth).toBe(7);
    });

    it("canceling empty list returns empty list", () => {
      const canceled = cancelInstallmentPurchase([]);

      expect(canceled).toHaveLength(0);
    });
  });
});
