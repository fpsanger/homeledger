import { buildMonthlyView } from "../../../src/domain/services/MonthlyView";
import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import type { InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";

const makeTransaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "txn-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: new Date("2026-05-10"),
  description: "Test",
  paymentMethod: "CASH",
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeInstallment = (overrides: Partial<InstallmentRecord> = {}): InstallmentRecord => ({
  id: "inst-1",
  creditCardPurchaseId: "purchase-1",
  installmentNumber: 1,
  amount: 100,
  dueYear: 2026,
  dueMonth: 5,
  isPaid: false,
  ...overrides,
});

describe("MonthlyView service", () => {
  describe("buildMonthlyView", () => {
    it("returns transactions that fall in the requested month", () => {
      const transactions = [
        makeTransaction({ id: "t1", date: new Date("2026-05-10") }),
        makeTransaction({ id: "t2", date: new Date("2026-06-01") }),
      ];

      const view = buildMonthlyView({ transactions, installments: [], year: 2026, month: 5 });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].id).toBe("t1");
    });

    it("excludes transactions from other months", () => {
      const transactions = [
        makeTransaction({ id: "t1", date: new Date("2026-04-30") }),
        makeTransaction({ id: "t2", date: new Date("2026-06-01") }),
      ];

      const view = buildMonthlyView({ transactions, installments: [], year: 2026, month: 5 });

      expect(view.transactions).toHaveLength(0);
    });

    it("includes installments due in the requested month", () => {
      const installments = [
        makeInstallment({ id: "i1", dueYear: 2026, dueMonth: 5 }),
        makeInstallment({ id: "i2", dueYear: 2026, dueMonth: 6 }),
      ];

      const view = buildMonthlyView({ transactions: [], installments, year: 2026, month: 5 });

      expect(view.installments).toHaveLength(1);
      expect(view.installments[0].id).toBe("i1");
    });

    it("filters transactions by personId when provided", () => {
      const transactions = [
        makeTransaction({ id: "t1", personId: "person-1" }),
        makeTransaction({ id: "t2", personId: "person-2" }),
      ];

      const view = buildMonthlyView({
        transactions,
        installments: [],
        year: 2026,
        month: 5,
        personId: "person-1",
      });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].personId).toBe("person-1");
    });

    it("returns all persons transactions when personId not provided", () => {
      const transactions = [
        makeTransaction({ id: "t1", personId: "person-1" }),
        makeTransaction({ id: "t2", personId: "person-2" }),
      ];

      const view = buildMonthlyView({ transactions, installments: [], year: 2026, month: 5 });

      expect(view.transactions).toHaveLength(2);
    });

    it("does not duplicate transactions across months", () => {
      const transactions = [
        makeTransaction({ id: "t1", date: new Date("2026-05-01") }),
        makeTransaction({ id: "t2", date: new Date("2026-05-31") }),
      ];

      const view = buildMonthlyView({ transactions, installments: [], year: 2026, month: 5 });

      expect(view.transactions).toHaveLength(2);
      const ids = view.transactions.map((t) => t.id);
      expect(new Set(ids).size).toBe(2);
    });

    it("view contains no workspace_id on any entry", () => {
      const view = buildMonthlyView({
        transactions: [makeTransaction()],
        installments: [makeInstallment()],
        year: 2026,
        month: 5,
      });

      for (const t of view.transactions) {
        expect(t).not.toHaveProperty("workspaceId");
      }
      for (const i of view.installments) {
        expect(i).not.toHaveProperty("workspaceId");
      }
    });
  });
});
