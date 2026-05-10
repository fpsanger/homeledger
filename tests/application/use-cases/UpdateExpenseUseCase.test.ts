import { updateExpenseUseCase } from "../../../src/application/use-cases/UpdateExpenseUseCase";
import type { ITransactionRepository, TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";

const makeTransactionRepo = (
  overrides: Partial<ITransactionRepository> = {},
): ITransactionRepository => ({
  findById: async () => null,
  findByMonth: async () => [],
  findByPersonAndMonth: async () => [],
  findByYear: async () => [],
  findByPersonAndYear: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() } as TransactionRecord),
  update: async (id, fields) => ({ id, createdAt: new Date(), updatedAt: new Date(), personId: "", type: "EXPENSE", amount: 0, date: new Date(), description: "", paymentMethod: null, source: null, categoryId: null, ...fields } as TransactionRecord),
  delete: async () => {},
  ...overrides,
});

const baseInput = {
  id: "exp-1",
  personId: "person-1",
  amount: 50,
  date: new Date("2026-05-04"),
  description: "Lunch",
  paymentMethod: "PIX" as const,
  categoryId: null as string | null,
};

describe("UpdateExpenseUseCase", () => {
  it("updates and returns the expense", async () => {
    const repo = makeTransactionRepo();
    const result = await updateExpenseUseCase(baseInput, repo);
    expect(result.id).toBe("exp-1");
    expect(result.amount).toBe(50);
    expect(result.paymentMethod).toBe("PIX");
  });

  it("calls repo.update with the correct fields", async () => {
    const updateFn = jest.fn(async (id: string, fields: Partial<Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">>) => ({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      personId: "",
      type: "EXPENSE" as const,
      amount: 0,
      date: new Date(),
      description: "",
      paymentMethod: null,
      source: null,
      categoryId: null,
      ...fields,
    }));
    const repo = makeTransactionRepo({ update: updateFn });
    await updateExpenseUseCase(baseInput, repo);
    expect(updateFn).toHaveBeenCalledWith("exp-1", expect.objectContaining({
      personId: "person-1",
      amount: 50,
      paymentMethod: "PIX",
    }));
  });

  it("throws when personId is missing", async () => {
    const repo = makeTransactionRepo();
    await expect(updateExpenseUseCase({ ...baseInput, personId: "" }, repo)).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeTransactionRepo();
    await expect(updateExpenseUseCase({ ...baseInput, amount: 0 }, repo)).rejects.toThrow("Amount must be positive");
  });

  it("throws when amount is negative", async () => {
    const repo = makeTransactionRepo();
    await expect(updateExpenseUseCase({ ...baseInput, amount: -5 }, repo)).rejects.toThrow("Amount must be positive");
  });

  it("throws when paymentMethod is invalid", async () => {
    const repo = makeTransactionRepo();
    await expect(
      updateExpenseUseCase({ ...baseInput, paymentMethod: "INVALID" as any }, repo)
    ).rejects.toThrow("Invalid payment method");
  });
});
