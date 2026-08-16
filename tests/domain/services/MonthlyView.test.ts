import type { InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import { buildMonthlyView } from "../../../src/domain/services/MonthlyView";

const makeTransaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "txn-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: new Date("2026-05-10"),
  description: "Test",
  paymentMethod: "CASH",
  source: null,
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
  transactionYear: 2026,
  transactionMonth: 5,
  isPaid: false,
  categoryId: null,
  ...overrides,
});

const makeRecurringRule = (
  overrides: Partial<RecurringTransactionRecord> = {},
): RecurringTransactionRecord => ({
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

    it("monthly view shows installment amount not the total purchase amount", () => {
      const installment = makeInstallment({ amount: 100, dueYear: 2026, dueMonth: 5 });

      const view = buildMonthlyView({
        transactions: [],
        installments: [installment],
        year: 2026,
        month: 5,
      });

      expect(view.installments[0].amount).toBe(100);
      expect(view.installments[0].amount).not.toBe(1200);
    });

    it("purchase total is not duplicated across all monthly views", () => {
      const installments = Array.from({ length: 12 }, (_, i) =>
        makeInstallment({ id: `inst-${i + 1}`, amount: 100, dueYear: 2026, dueMonth: i + 1 }),
      );

      const januaryView = buildMonthlyView({
        transactions: [],
        installments,
        year: 2026,
        month: 1,
      });

      expect(januaryView.installments).toHaveLength(1);
      expect(januaryView.installments[0].amount).toBe(100);
      const monthTotal = januaryView.installments.reduce((sum, i) => sum + i.amount, 0);
      expect(monthTotal).toBe(100);
      expect(monthTotal).not.toBe(1200);
    });

    it("includes a recurring occurrence for an active rule in the target month", () => {
      const rule = makeRecurringRule();
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].id).toBe("rule-1");
      expect(view.transactions[0].amount).toBe(500);
    });

    it("excludes a recurring rule that starts after the target month", () => {
      const rule = makeRecurringRule({ startDate: new Date("2026-06-01") });
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(0);
    });

    it("excludes a recurring rule canceled in the target month", () => {
      const rule = makeRecurringRule({ endDate: new Date("2026-05-10") });
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(0);
    });

    it("filters recurring occurrences by personId when provided", () => {
      const rules = [
        makeRecurringRule({ id: "r1", personId: "person-1" }),
        makeRecurringRule({ id: "r2", personId: "person-2" }),
      ];
      const view = buildMonthlyView({
        transactions: [],
        installments: [],
        recurringRules: rules,
        year: 2026,
        month: 5,
        personId: "person-1",
      });

      expect(view.transactions).toHaveLength(1);
      expect(view.transactions[0].id).toBe("r1");
    });

    it("merges recurring occurrences with regular transactions", () => {
      const txn = makeTransaction({ id: "txn-1" });
      const rule = makeRecurringRule({ id: "rule-1" });
      const view = buildMonthlyView({
        transactions: [txn],
        installments: [],
        recurringRules: [rule],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(2);
      const ids = view.transactions.map((t) => t.id);
      expect(ids).toContain("txn-1");
      expect(ids).toContain("rule-1");
    });

    it("existing tests still pass when recurringRules is omitted", () => {
      const txn = makeTransaction({ id: "txn-1", date: new Date("2026-05-10") });
      const view = buildMonthlyView({
        transactions: [txn],
        installments: [],
        year: 2026,
        month: 5,
      });

      expect(view.transactions).toHaveLength(1);
    });

    describe("filterBy transactionMonth", () => {
      it("returns installments whose transactionMonth matches the view month", () => {
        const installments = [
          makeInstallment({
            id: "i1",
            transactionYear: 2026,
            transactionMonth: 6,
            dueYear: 2026,
            dueMonth: 7,
          }),
          makeInstallment({
            id: "i2",
            transactionYear: 2026,
            transactionMonth: 7,
            dueYear: 2026,
            dueMonth: 8,
          }),
        ];

        const view = buildMonthlyView({
          transactions: [],
          installments,
          year: 2026,
          month: 6,
          filterBy: "transactionMonth",
        });

        expect(view.installments).toHaveLength(1);
        expect(view.installments[0].id).toBe("i1");
      });

      it("does not use dueMonth when filterBy is transactionMonth", () => {
        // installment dueMonth=6 but transactionMonth=5 — should appear in May view not June
        const installment = makeInstallment({
          id: "i1",
          transactionYear: 2026,
          transactionMonth: 5,
          dueYear: 2026,
          dueMonth: 6,
        });

        const juneView = buildMonthlyView({
          transactions: [],
          installments: [installment],
          year: 2026,
          month: 6,
          filterBy: "transactionMonth",
        });
        const mayView = buildMonthlyView({
          transactions: [],
          installments: [installment],
          year: 2026,
          month: 5,
          filterBy: "transactionMonth",
        });

        expect(juneView.installments).toHaveLength(0);
        expect(mayView.installments).toHaveLength(1);
      });

      it("handles year boundary — transactionYear must also match", () => {
        const installments = [
          makeInstallment({ id: "i1", transactionYear: 2026, transactionMonth: 1 }),
          makeInstallment({ id: "i2", transactionYear: 2027, transactionMonth: 1 }),
        ];

        const view = buildMonthlyView({
          transactions: [],
          installments,
          year: 2027,
          month: 1,
          filterBy: "transactionMonth",
        });

        expect(view.installments).toHaveLength(1);
        expect(view.installments[0].id).toBe("i2");
      });
    });
  });
});
