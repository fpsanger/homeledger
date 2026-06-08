import {
  cancelInstallmentPurchase,
  createInstallmentPurchase,
  createInstallments,
  resolveFirstDueMonth,
} from "../../../src/domain/services/InstallmentPurchase";

const basePurchase = {
  personId: "person-1",
  totalAmount: 1200,
  numberOfInstallments: 12,
  purchaseDate: new Date("2026-01-15"),
  description: "TV",
  categoryId: null,
  creditCardId: "card-1",
  closureDay: 25,
  alwaysNextMonth: false,
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

    it("first transactionMonth equals purchase month regardless of card rules", () => {
      // basePurchase: Jan 15, closureDay 25, alwaysNextMonth false
      // purchase before closure → dueMonth = Jan, transactionMonth = Jan
      const installments = createInstallments(basePurchase);

      expect(installments[0].transactionYear).toBe(2026);
      expect(installments[0].transactionMonth).toBe(1);
    });

    it("transactionMonth advances sequentially from purchase month, ignoring card rules", () => {
      // alwaysNextMonth=true shifts dueMonth by 1, but transactionMonth always starts at purchase month
      const purchase = {
        ...basePurchase,
        purchaseDate: new Date("2026-06-20"),
        numberOfInstallments: 3,
        alwaysNextMonth: true,
      };
      const installments = createInstallments(purchase);

      // dueMonths would be Jul, Aug, Sep (shifted by alwaysNextMonth)
      // transactionMonths must be Jun, Jul, Aug (starts at purchase month)
      expect(installments[0].transactionYear).toBe(2026);
      expect(installments[0].transactionMonth).toBe(6);
      expect(installments[1].transactionYear).toBe(2026);
      expect(installments[1].transactionMonth).toBe(7);
      expect(installments[2].transactionYear).toBe(2026);
      expect(installments[2].transactionMonth).toBe(8);
    });

    it("transactionMonth handles year rollover correctly", () => {
      const purchase = {
        ...basePurchase,
        purchaseDate: new Date("2026-11-01"),
        numberOfInstallments: 3,
      };
      const installments = createInstallments(purchase);

      expect(installments[0].transactionYear).toBe(2026);
      expect(installments[0].transactionMonth).toBe(11);
      expect(installments[1].transactionYear).toBe(2026);
      expect(installments[1].transactionMonth).toBe(12);
      expect(installments[2].transactionYear).toBe(2027);
      expect(installments[2].transactionMonth).toBe(1);
    });

    it("transactionMonth is independent of closureInPreviousMonth shift", () => {
      // closureInPreviousMonth shifts dueMonth by 1 or 2, transactionMonth unaffected
      const purchase = {
        ...basePurchase,
        purchaseDate: new Date("2026-03-28"),
        closureDay: 27,
        closureInPreviousMonth: true,
        numberOfInstallments: 2,
      };
      const installments = createInstallments(purchase);

      // dueMonths: purchaseDay(28) >= closureDay(27) + closureInPreviousMonth → shift 2 → May, Jun
      // transactionMonths must always be Mar, Apr
      expect(installments[0].transactionMonth).toBe(3);
      expect(installments[1].transactionMonth).toBe(4);
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

    it("throws when numberOfInstallments is 0", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, numberOfInstallments: 0 }),
      ).toThrow("Number of installments must be at least 1");
    });

    it("allows numberOfInstallments of 1", () => {
      expect(() =>
        createInstallmentPurchase({ ...basePurchaseWithId, numberOfInstallments: 1 }),
      ).not.toThrow();
    });

    it("throws when personId is missing", () => {
      expect(() => createInstallmentPurchase({ ...basePurchaseWithId, personId: "" })).toThrow(
        "Person is required",
      );
    });

    it("throws when totalAmount is not positive", () => {
      expect(() => createInstallmentPurchase({ ...basePurchaseWithId, totalAmount: 0 })).toThrow(
        "Amount must be positive",
      );
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
        purchaseDate: new Date("2026-03-01"), // day 1 < closure 25 → starts March
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
    const makeInstallmentRecord = (overrides = {}) => ({
      id: "inst-1",
      creditCardPurchaseId: "purchase-1",
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
      const installments = [
        makeInstallmentRecord({ installmentNumber: 1 }),
        makeInstallmentRecord({ installmentNumber: 2 }),
      ];

      const canceled = cancelInstallmentPurchase(installments);

      for (const inst of canceled) {
        expect(inst.isCanceled).toBe(true);
      }
    });

    it("cancels all installments regardless of paid status", () => {
      const installments = [
        makeInstallmentRecord({ isPaid: true }),
        makeInstallmentRecord({ isPaid: false }),
      ];

      const canceled = cancelInstallmentPurchase(installments);

      expect(canceled).toHaveLength(2);
      for (const inst of canceled) {
        expect(inst.isCanceled).toBe(true);
      }
    });

    it("preserves all original installment fields after cancellation", () => {
      const installments = [
        makeInstallmentRecord({ installmentNumber: 3, amount: 150, dueMonth: 7 }),
      ];

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

  describe("resolveFirstDueMonth", () => {
    it("purchase before closure day goes to current month", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 10,
        purchaseYear: 2026,
        purchaseMonth: 3,
        closureDay: 25,
        alwaysNextMonth: false,
      });
      expect(result).toEqual({ year: 2026, month: 3 });
    });

    it("purchase on closure day goes to next month", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 25,
        purchaseYear: 2026,
        purchaseMonth: 3,
        closureDay: 25,
        alwaysNextMonth: false,
      });
      expect(result).toEqual({ year: 2026, month: 4 });
    });

    it("purchase after closure day goes to next month", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 28,
        purchaseYear: 2026,
        purchaseMonth: 3,
        closureDay: 25,
        alwaysNextMonth: false,
      });
      expect(result).toEqual({ year: 2026, month: 4 });
    });

    it("next month rolls over to January when purchase is in December", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 26,
        purchaseYear: 2026,
        purchaseMonth: 12,
        closureDay: 25,
        alwaysNextMonth: false,
      });
      expect(result).toEqual({ year: 2027, month: 1 });
    });

    it("alwaysNextMonth forces next month even when purchase is before closure", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 5,
        purchaseYear: 2026,
        purchaseMonth: 3,
        closureDay: 25,
        alwaysNextMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 4 });
    });

    it("closureInPreviousMonth forces next month even when purchaseDay < closureDay", () => {
      // Closure was April 28 (previous month) for May's bill.
      // Purchase on May 6: day 6 < closureDay 28, but closure already passed → June.
      const result = resolveFirstDueMonth({
        purchaseDay: 6,
        purchaseYear: 2026,
        purchaseMonth: 5,
        closureDay: 28,
        alwaysNextMonth: false,
        closureInPreviousMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 6 });
    });

    it("closureInPreviousMonth in December rolls over to next year", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 6,
        purchaseYear: 2026,
        purchaseMonth: 12,
        closureDay: 28,
        alwaysNextMonth: false,
        closureInPreviousMonth: true,
      });
      expect(result).toEqual({ year: 2027, month: 1 });
    });

    it("closureInPreviousMonth with purchaseDay >= closureDay shifts by 2 months", () => {
      // April closure = March 27. Purchase on March 27 → misses April bill → goes to May.
      const result = resolveFirstDueMonth({
        purchaseDay: 27,
        purchaseYear: 2026,
        purchaseMonth: 3,
        closureDay: 27,
        alwaysNextMonth: false,
        closureInPreviousMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 5 });
    });

    it("closureInPreviousMonth with purchaseDay >= closureDay in November shifts to January", () => {
      // January closure = November 27. Purchase on November 28 → misses January bill → February.
      const result = resolveFirstDueMonth({
        purchaseDay: 28,
        purchaseYear: 2026,
        purchaseMonth: 11,
        closureDay: 27,
        alwaysNextMonth: false,
        closureInPreviousMonth: true,
      });
      expect(result).toEqual({ year: 2027, month: 1 });
    });

    it("closureNextMonth: purchase stays in same month regardless of closureDay", () => {
      // Closure is on day 1 of NEXT month (Nov 1). Purchase Oct 10 < Nov 1 → October.
      const result = resolveFirstDueMonth({
        purchaseDay: 10,
        purchaseYear: 2026,
        purchaseMonth: 10,
        closureDay: 1,
        alwaysNextMonth: false,
        closureNextMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 10 });
    });

    it("closureNextMonth with high closureDay: purchase still stays in same month", () => {
      // Closure is on day 25 of NEXT month. Purchase Oct 10 is always before that.
      const result = resolveFirstDueMonth({
        purchaseDay: 10,
        purchaseYear: 2026,
        purchaseMonth: 10,
        closureDay: 25,
        alwaysNextMonth: false,
        closureNextMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 10 });
    });

    it("closureNextMonth in December stays in December", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 15,
        purchaseYear: 2026,
        purchaseMonth: 12,
        closureDay: 1,
        alwaysNextMonth: false,
        closureNextMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 12 });
    });

    it("closureNextMonth is overridden by alwaysNextMonth", () => {
      const result = resolveFirstDueMonth({
        purchaseDay: 10,
        purchaseYear: 2026,
        purchaseMonth: 10,
        closureDay: 1,
        alwaysNextMonth: true,
        closureNextMonth: true,
      });
      expect(result).toEqual({ year: 2026, month: 11 });
    });

  });
});
