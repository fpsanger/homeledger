import { createExpense } from "../../../src/domain/entities/Transaction";

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
      expect(() => createExpense({ ...baseExpense, amount: -50 })).toThrow("Amount must be positive");
    });

    it("throws when date is missing", () => {
      expect(() => createExpense({ ...baseExpense, date: null as unknown as Date })).toThrow("Date is required");
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

    it("accepts all supported payment methods", () => {
      const methods = ["CASH", "DEBIT_CARD", "CREDIT_CARD", "PIX", "BANK_TRANSFER", "BOLETO"] as const;

      for (const method of methods) {
        expect(() => createExpense({ ...baseExpense, paymentMethod: method })).not.toThrow();
      }
    });
  });
});
