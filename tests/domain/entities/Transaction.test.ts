import { createExpense, createIncome, createInvestment } from "../../../src/domain/entities/Transaction";

const baseExpense = {
  id: "txn-1",
  personId: "person-1",
  amount: 150.0,
  date: new Date("2026-05-10"),
  description: "Grocery",
  paymentMethod: "DEBIT_CARD" as const,
  categoryId: null,
};

describe("Expense entity", () => {
  describe("createExpense", () => {
    it("creates an expense with valid data", () => {
      const expense = createExpense(baseExpense);

      expect(expense.id).toBe("txn-1");
      expect(expense.personId).toBe("person-1");
      expect(expense.type).toBe("EXPENSE");
      expect(expense.amount).toBe(150.0);
    });

    it("always sets type to EXPENSE", () => {
      const expense = createExpense(baseExpense);

      expect(expense.type).toBe("EXPENSE");
    });

    it("throws when personId is missing", () => {
      expect(() => createExpense({ ...baseExpense, personId: "" })).toThrow("Person is required");
    });

    it("throws when amount is zero", () => {
      expect(() => createExpense({ ...baseExpense, amount: 0 })).toThrow("Amount must be positive");
    });

    it("throws when amount is negative", () => {
      expect(() => createExpense({ ...baseExpense, amount: -50 })).toThrow(
        "Amount must be positive",
      );
    });

    it("throws when date is missing", () => {
      expect(() => createExpense({ ...baseExpense, date: null as unknown as Date })).toThrow(
        "Date is required",
      );
    });

    it("allows categoryId to be null (optional)", () => {
      const expense = createExpense({ ...baseExpense, categoryId: null });

      expect(expense.categoryId).toBeNull();
    });

    it("accepts a categoryId when provided", () => {
      const expense = createExpense({ ...baseExpense, categoryId: "cat-1" });

      expect(expense.categoryId).toBe("cat-1");
    });

    it("does not require workspace_id", () => {
      const expense = createExpense(baseExpense);

      expect(expense).not.toHaveProperty("workspaceId");
      expect(expense).not.toHaveProperty("workspace_id");
    });

    it("one-time expense has no credit card installment relationship", () => {
      const expense = createExpense(baseExpense);

      expect(expense).not.toHaveProperty("creditCardPurchaseId");
      expect(expense).not.toHaveProperty("installments");
      expect(expense).not.toHaveProperty("numberOfInstallments");
    });

    it("accepts all supported payment methods", () => {
      const methods = [
        "CASH",
        "DEBIT_CARD",
        "CREDIT_CARD",
        "PIX",
        "BANK_TRANSFER",
        "BOLETO",
      ] as const;

      for (const method of methods) {
        expect(() => createExpense({ ...baseExpense, paymentMethod: method })).not.toThrow();
      }
    });
  });
});

const baseInvestment = {
  id: "txn-3",
  personId: "person-1",
  amount: 1000.0,
  date: new Date("2026-05-01"),
  description: "FGTS investment",
  categoryId: "cat-inv-1",
};

describe("Investment entity", () => {
  describe("createInvestment", () => {
    it("creates an investment with valid data", () => {
      const inv = createInvestment(baseInvestment);

      expect(inv.id).toBe("txn-3");
      expect(inv.type).toBe("INVESTMENT");
      expect(inv.amount).toBe(1000.0);
      expect(inv.categoryId).toBe("cat-inv-1");
    });

    it("always sets source to null", () => {
      const inv = createInvestment(baseInvestment);
      expect(inv.source).toBeNull();
    });

    it("always sets paymentMethod to null", () => {
      const inv = createInvestment(baseInvestment);
      expect(inv.paymentMethod).toBeNull();
    });

    it("throws when personId is missing", () => {
      expect(() => createInvestment({ ...baseInvestment, personId: "" })).toThrow("Person is required");
    });

    it("throws when amount is zero", () => {
      expect(() => createInvestment({ ...baseInvestment, amount: 0 })).toThrow("Amount must be positive");
    });

    it("throws when amount is negative", () => {
      expect(() => createInvestment({ ...baseInvestment, amount: -100 })).toThrow("Amount must be positive");
    });

    it("throws when date is missing", () => {
      expect(() => createInvestment({ ...baseInvestment, date: null as unknown as Date })).toThrow("Date is required");
    });

    it("throws when categoryId is missing", () => {
      expect(() => createInvestment({ ...baseInvestment, categoryId: "" })).toThrow("Category is required");
    });
  });
});

const baseIncome = {
  id: "txn-2",
  personId: "person-1",
  amount: 5000.0,
  date: new Date("2026-05-01"),
  description: "Monthly salary",
  source: "SALARY" as const,
  categoryId: null,
};

describe("Income entity", () => {
  describe("createIncome", () => {
    it("creates an income with valid data", () => {
      const income = createIncome(baseIncome);

      expect(income.id).toBe("txn-2");
      expect(income.personId).toBe("person-1");
      expect(income.type).toBe("INCOME");
      expect(income.amount).toBe(5000.0);
      expect(income.source).toBe("SALARY");
    });

    it("always sets type to INCOME", () => {
      const income = createIncome(baseIncome);

      expect(income.type).toBe("INCOME");
    });

    it("throws when personId is missing", () => {
      expect(() => createIncome({ ...baseIncome, personId: "" })).toThrow("Person is required");
    });

    it("throws when amount is zero", () => {
      expect(() => createIncome({ ...baseIncome, amount: 0 })).toThrow("Amount must be positive");
    });

    it("throws when amount is negative", () => {
      expect(() => createIncome({ ...baseIncome, amount: -100 })).toThrow("Amount must be positive");
    });

    it("throws when date is missing", () => {
      expect(() => createIncome({ ...baseIncome, date: null as unknown as Date })).toThrow(
        "Date is required",
      );
    });

    it("throws when source is missing", () => {
      expect(() => createIncome({ ...baseIncome, source: "" as never })).toThrow("Source is required");
    });

    it("allows categoryId to be null", () => {
      const income = createIncome({ ...baseIncome, categoryId: null });

      expect(income.categoryId).toBeNull();
    });

    it("accepts a categoryId when provided", () => {
      const income = createIncome({ ...baseIncome, categoryId: "cat-1" });

      expect(income.categoryId).toBe("cat-1");
    });

    it("accepts all supported income sources", () => {
      const sources = ["SALARY", "FREELANCE", "RENTAL", "INVESTMENT", "OTHER"] as const;

      for (const source of sources) {
        expect(() => createIncome({ ...baseIncome, source })).not.toThrow();
      }
    });
  });
});
