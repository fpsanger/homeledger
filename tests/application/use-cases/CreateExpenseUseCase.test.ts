import { createExpenseUseCase } from "../../../src/application/use-cases/CreateExpenseUseCase";
import type { ICategoryRepository, CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";
import type { ITransactionRepository, TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";

const makeTransactionRepo = (
  overrides: Partial<ITransactionRepository> = {},
): ITransactionRepository => ({
  findById: async () => null,
  findByMonth: async () => [],
  findByPersonAndMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() } as TransactionRecord),
  delete: async () => {},
  ...overrides,
});

const makeCategoryRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const leafCategory: CategoryRecord = {
  id: "cat-leaf",
  name: "Restaurants",
  parentId: "cat-parent",
  path: "Food/Restaurants",
  level: 1,
  householdId: "default",
  createdAt: new Date(),
};

const parentCategory: CategoryRecord = {
  id: "cat-parent",
  name: "Food",
  parentId: null,
  path: "Food",
  level: 0,
  householdId: "default",
  createdAt: new Date(),
};

const baseInput = {
  id: "exp-1",
  personId: "person-1",
  amount: 50,
  date: new Date("2026-05-04"),
  description: "Lunch",
  paymentMethod: "PIX" as const,
  categoryId: null as string | null,
};

describe("CreateExpenseUseCase", () => {
  it("saves and returns the expense when categoryId is null", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    const result = await createExpenseUseCase(baseInput, transactionRepo, categoryRepo);

    expect(result.id).toBe("exp-1");
    expect(result.type).toBe("EXPENSE");
    expect(result.amount).toBe(50);
  });

  it("saves and returns the expense when categoryId is a leaf", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createExpenseUseCase(
      { ...baseInput, categoryId: "cat-leaf" },
      transactionRepo,
      categoryRepo,
    );

    expect(result.id).toBe("exp-1");
    expect(result.categoryId).toBe("cat-leaf");
  });

  it("throws when categoryId is a non-leaf category", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    await expect(
      createExpenseUseCase(
        { ...baseInput, categoryId: "cat-parent" },
        transactionRepo,
        categoryRepo,
      ),
    ).rejects.toThrow("Expense must use the most specific category");
  });

  it("throws when categoryId does not exist", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createExpenseUseCase(
        { ...baseInput, categoryId: "cat-nonexistent" },
        transactionRepo,
        categoryRepo,
      ),
    ).rejects.toThrow("Category not found");
  });

  it("throws when personId is missing", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createExpenseUseCase({ ...baseInput, personId: "" }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createExpenseUseCase({ ...baseInput, amount: -10 }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Amount must be positive");
  });
});
