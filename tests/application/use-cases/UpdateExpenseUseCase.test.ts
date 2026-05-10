import { updateExpenseUseCase } from "../../../src/application/use-cases/UpdateExpenseUseCase";
import type { ICategoryRepository, CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";
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

const makeCategoryRepo = (categories: CategoryRecord[] = [], overrides = {}): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find(c => c.id === id) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const existingRecord: TransactionRecord = {
  id: "exp-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 50,
  date: new Date("2026-05-04"),
  description: "Lunch",
  paymentMethod: "PIX",
  source: null,
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRepoWithExisting = (overrides: Partial<ITransactionRepository> = {}) =>
  makeTransactionRepo({ findById: async () => existingRecord, ...overrides });

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
    const repo = makeRepoWithExisting();
    const result = await updateExpenseUseCase(baseInput, repo, makeCategoryRepo());
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
    const repo = makeRepoWithExisting({ update: updateFn });
    await updateExpenseUseCase(baseInput, repo, makeCategoryRepo());
    expect(updateFn).toHaveBeenCalledWith("exp-1", expect.objectContaining({
      personId: "person-1",
      amount: 50,
      paymentMethod: "PIX",
    }));
  });

  it("throws when personId is missing", async () => {
    const repo = makeRepoWithExisting();
    await expect(updateExpenseUseCase({ ...baseInput, personId: "" }, repo, makeCategoryRepo())).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeRepoWithExisting();
    await expect(updateExpenseUseCase({ ...baseInput, amount: 0 }, repo, makeCategoryRepo())).rejects.toThrow("Amount must be positive");
  });

  it("throws when amount is negative", async () => {
    const repo = makeRepoWithExisting();
    await expect(updateExpenseUseCase({ ...baseInput, amount: -5 }, repo, makeCategoryRepo())).rejects.toThrow("Amount must be positive");
  });

  it("throws when paymentMethod is invalid", async () => {
    const repo = makeRepoWithExisting();
    await expect(
      updateExpenseUseCase({ ...baseInput, paymentMethod: "INVALID" as any }, repo, makeCategoryRepo())
    ).rejects.toThrow("Invalid payment method");
  });

  it("throws when transaction does not exist", async () => {
    const repo = makeTransactionRepo({ findById: async () => null });
    await expect(updateExpenseUseCase(baseInput, repo, makeCategoryRepo())).rejects.toThrow("Transaction not found");
  });

  it("throws when categoryId is set and category does not exist", async () => {
    const repo = makeRepoWithExisting();
    const categoryRepo = makeCategoryRepo([]);
    await expect(
      updateExpenseUseCase({ ...baseInput, categoryId: "non-existent-cat" }, repo, categoryRepo)
    ).rejects.toThrow();
  });
});
