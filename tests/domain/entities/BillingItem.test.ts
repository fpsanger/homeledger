import {
  createInstallmentBillingItem,
  createTransactionBillingItem,
  isInstallmentBillingItem,
} from "../../../src/domain/entities/BillingItem";
import { InvalidBillingItemError } from "../../../src/domain/errors";

const baseInstallment = {
  description: "Credit Card Purchase",
  amount: 100.0,
  date: new Date("2026-05-10"),
  installmentNumber: 1,
  totalInstallments: 3,
};

describe("BillingItem - Installment", () => {
  describe("createInstallmentBillingItem", () => {
    it("creates an installment billing item with valid data", () => {
      const item = createInstallmentBillingItem(baseInstallment);

      expect(item.kind).toBe("installment");
      expect(item.description).toBe("Credit Card Purchase");
      expect(item.amount).toBe(100.0);
      expect(item.date).toEqual(new Date("2026-05-10"));
      expect(item.installmentNumber).toBe(1);
      expect(item.totalInstallments).toBe(3);
    });

    it("throws when amount is zero", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, amount: 0 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when amount is negative", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, amount: -50 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when description is empty", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, description: "" })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when description is missing", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, description: "" })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when date is missing", () => {
      expect(() =>
        createInstallmentBillingItem({
          ...baseInstallment,
          date: null as unknown as Date,
        })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when installmentNumber is zero", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, installmentNumber: 0 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when installmentNumber is negative", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, installmentNumber: -1 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when totalInstallments is zero", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, totalInstallments: 0 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when totalInstallments is negative", () => {
      expect(() =>
        createInstallmentBillingItem({ ...baseInstallment, totalInstallments: -1 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when installmentNumber > totalInstallments", () => {
      expect(() =>
        createInstallmentBillingItem({
          ...baseInstallment,
          installmentNumber: 4,
          totalInstallments: 3,
        })
      ).toThrow(InvalidBillingItemError);
    });

    it("allows installmentNumber === totalInstallments", () => {
      const item = createInstallmentBillingItem({
        ...baseInstallment,
        installmentNumber: 3,
        totalInstallments: 3,
      });

      expect(item.installmentNumber).toBe(3);
      expect(item.totalInstallments).toBe(3);
    });
  });
});

const baseTransaction = {
  description: "Store Purchase",
  amount: 250.5,
  date: new Date("2026-05-15"),
  transactionType: "EXPENSE" as const,
};

describe("BillingItem - Transaction", () => {
  describe("createTransactionBillingItem", () => {
    it("creates a transaction billing item with valid data (EXPENSE)", () => {
      const item = createTransactionBillingItem(baseTransaction);

      expect(item.kind).toBe("transaction");
      expect(item.description).toBe("Store Purchase");
      expect(item.amount).toBe(250.5);
      expect(item.date).toEqual(new Date("2026-05-15"));
      expect(item.transactionType).toBe("EXPENSE");
    });

    it("creates a transaction billing item with valid data (INCOME)", () => {
      const item = createTransactionBillingItem({
        ...baseTransaction,
        transactionType: "INCOME",
      });

      expect(item.transactionType).toBe("INCOME");
    });

    it("creates a transaction billing item with valid data (INVESTMENT)", () => {
      const item = createTransactionBillingItem({
        ...baseTransaction,
        transactionType: "INVESTMENT",
      });

      expect(item.transactionType).toBe("INVESTMENT");
    });

    it("throws when amount is zero", () => {
      expect(() =>
        createTransactionBillingItem({ ...baseTransaction, amount: 0 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when amount is negative", () => {
      expect(() =>
        createTransactionBillingItem({ ...baseTransaction, amount: -100 })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when description is empty", () => {
      expect(() =>
        createTransactionBillingItem({ ...baseTransaction, description: "" })
      ).toThrow(InvalidBillingItemError);
    });

    it("throws when date is missing", () => {
      expect(() =>
        createTransactionBillingItem({
          ...baseTransaction,
          date: null as unknown as Date,
        })
      ).toThrow(InvalidBillingItemError);
    });
  });
});

describe("BillingItem - Type Guard", () => {
  describe("isInstallmentBillingItem", () => {
    it("returns true for installment billing items", () => {
      const item = createInstallmentBillingItem(baseInstallment);

      expect(isInstallmentBillingItem(item)).toBe(true);
    });

    it("returns false for transaction billing items", () => {
      const item = createTransactionBillingItem(baseTransaction);

      expect(isInstallmentBillingItem(item)).toBe(false);
    });
  });
});
