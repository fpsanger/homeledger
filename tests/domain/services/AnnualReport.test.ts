import type { InstallmentRecord } from "../../../src/domain/repositories/ICreditCardPurchaseRepository";
import type { TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";
import { buildAnnualReport } from "../../../src/domain/services/AnnualReport";

const makeTransaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "txn-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: new Date("2025-01-15"),
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
  amount: 200,
  dueYear: 2025,
  dueMonth: 1,
  isPaid: false,
  isCanceled: false,
      categoryId: null,
  ...overrides,
});

describe("buildAnnualReport", () => {
  it("returns 12 month entries for the given year", () => {
    const result = buildAnnualReport({ transactions: [], installments: [], year: 2025 });
    expect(result.months).toHaveLength(12);
    expect(result.months[0].month).toBe(1);
    expect(result.months[11].month).toBe(12);
  });

  it("sums INCOME transactions by month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 1000, date: new Date("2025-03-10") }),
      makeTransaction({ id: "t2", type: "INCOME", amount: 500, date: new Date("2025-03-20") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[2].income).toBe(1500); // month index 2 = March
  });

  it("sums EXPENSE transactions by month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "EXPENSE", amount: 300, date: new Date("2025-05-05") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[4].expenses).toBe(300);
  });

  it("includes installment amounts in expenses", () => {
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 2 }),
    ];
    const result = buildAnnualReport({ transactions: [], installments, year: 2025 });
    expect(result.months[1].expenses).toBe(200);
  });

  it("excludes canceled installments", () => {
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 2, isCanceled: true }),
    ];
    const result = buildAnnualReport({ transactions: [], installments, year: 2025 });
    expect(result.months[1].expenses).toBe(0);
  });

  it("computes balance as income minus expenses per month", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 1000, date: new Date("2025-06-01") }),
      makeTransaction({ id: "t2", type: "EXPENSE", amount: 400, date: new Date("2025-06-15") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[5].balance).toBe(600);
  });

  it("computes year totals", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 2000, date: new Date("2025-01-01") }),
      makeTransaction({ id: "t2", type: "EXPENSE", amount: 800, date: new Date("2025-01-15") }),
    ];
    const installments = [
      makeInstallment({ id: "i1", amount: 200, dueYear: 2025, dueMonth: 1 }),
    ];
    const result = buildAnnualReport({ transactions, installments, year: 2025 });
    expect(result.totalIncome).toBe(2000);
    expect(result.totalExpenses).toBe(1000);
    expect(result.totalBalance).toBe(1000);
  });

  it("filters by personId when provided", () => {
    const transactions = [
      makeTransaction({ id: "t1", personId: "person-1", type: "INCOME", amount: 1000, date: new Date("2025-01-01") }),
      makeTransaction({ id: "t2", personId: "person-2", type: "INCOME", amount: 999, date: new Date("2025-01-01") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025, personId: "person-1" });
    expect(result.totalIncome).toBe(1000);
  });

  it("ignores transactions from other years", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 5000, date: new Date("2024-12-31") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.totalIncome).toBe(0);
  });

  it("excludes INVESTMENT transactions from income", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INVESTMENT" as const, amount: 500, date: new Date("2025-03-01") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[2].income).toBe(0);
  });

  it("excludes INVESTMENT transactions from expenses", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INVESTMENT" as const, amount: 500, date: new Date("2025-03-01") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[2].expenses).toBe(0);
  });

  it("does not affect balance when INVESTMENT transactions present", () => {
    const transactions = [
      makeTransaction({ id: "t1", type: "INCOME", amount: 1000, date: new Date("2025-04-01") }),
      makeTransaction({ id: "t2", type: "INVESTMENT" as const, amount: 300, date: new Date("2025-04-01") }),
    ];
    const result = buildAnnualReport({ transactions, installments: [], year: 2025 });
    expect(result.months[3].balance).toBe(1000);
  });
});
