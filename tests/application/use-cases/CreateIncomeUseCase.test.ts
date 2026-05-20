import { createIncomeUseCase } from "../../../src/application/use-cases/CreateIncomeUseCase";
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
  update: async (id, fields) => ({ id, createdAt: new Date(), updatedAt: new Date(), personId: "", type: "INCOME", amount: 0, date: new Date(), description: "", paymentMethod: null, source: null, categoryId: null, ...fields } as TransactionRecord),
  delete: async () => {},
  ...overrides,
});

const makeCategoryRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  findRootByName: async (name) => categories.find((c) => c.parentId === null && c.name === name) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const leafCategory: CategoryRecord = {
  id: "cat-leaf",
  name: "Wages",
  parentId: "cat-parent",
  path: "Income/Wages",
  level: 1,
  householdId: "default",
  createdAt: new Date(),
};

const parentCategory: CategoryRecord = {
  id: "cat-parent",
  name: "Income",
  parentId: null,
  path: "Income",
  level: 0,
  householdId: "default",
  createdAt: new Date(),
};

const baseInput = {
  id: "inc-1",
  personId: "person-1",
  amount: 5000,
  date: new Date("2026-05-01"),
  description: "Monthly salary",
  source: "SALARY" as const,
  categoryId: null as string | null,
};

describe("CreateIncomeUseCase", () => {
  it("saves and returns the income when categoryId is null", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    const result = await createIncomeUseCase(baseInput, transactionRepo, categoryRepo);

    expect(result.record.id).toBe("inc-1");
    expect(result.record.type).toBe("INCOME");
    expect(result.record.amount).toBe(5000);
    expect(result.record.source).toBe("SALARY");
    expect(result.isDuplicate).toBe(false);
  });

  it("saves and returns the income when categoryId is a leaf", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createIncomeUseCase(
      { ...baseInput, categoryId: "cat-leaf" },
      transactionRepo,
      categoryRepo,
    );

    expect(result.record.categoryId).toBe("cat-leaf");
  });

  it("throws when categoryId is a non-leaf category", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    await expect(
      createIncomeUseCase({ ...baseInput, categoryId: "cat-parent" }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Income must use the most specific category");
  });

  it("throws when categoryId does not exist", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createIncomeUseCase({ ...baseInput, categoryId: "cat-nonexistent" }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Category not found");
  });

  it("throws when personId is missing", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createIncomeUseCase({ ...baseInput, personId: "" }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createIncomeUseCase({ ...baseInput, amount: -10 }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Amount must be positive");
  });

  it("throws when source is missing", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([]);

    await expect(
      createIncomeUseCase({ ...baseInput, source: "" as never }, transactionRepo, categoryRepo),
    ).rejects.toThrow("Source is required");
  });

  it("returns isDuplicate=true when same income exists on same day", async () => {
    const existing: TransactionRecord = {
      id: "inc-existing",
      personId: "person-1",
      type: "INCOME",
      amount: 5000,
      date: new Date("2026-05-01"),
      description: "Other salary",
      paymentMethod: null,
      source: "SALARY",
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepo = makeTransactionRepo({
      findByPersonAndMonth: async () => [existing],
    });
    const categoryRepo = makeCategoryRepo([]);

    const result = await createIncomeUseCase(baseInput, transactionRepo, categoryRepo);
    expect(result.isDuplicate).toBe(true);
    expect(result.record.id).toBe("inc-1");
  });

  it("returns isDuplicate=false when same amount but different day", async () => {
    const existing: TransactionRecord = {
      id: "inc-existing",
      personId: "person-1",
      type: "INCOME",
      amount: 5000,
      date: new Date("2026-05-02"),
      description: "Other salary",
      paymentMethod: null,
      source: "SALARY",
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepo = makeTransactionRepo({
      findByPersonAndMonth: async () => [existing],
    });
    const categoryRepo = makeCategoryRepo([]);

    const result = await createIncomeUseCase(baseInput, transactionRepo, categoryRepo);
    expect(result.isDuplicate).toBe(false);
    expect(result.record.id).toBe("inc-1");
  });
});
