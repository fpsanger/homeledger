import { createInvestmentUseCase } from "../../../src/application/use-cases/CreateInvestmentUseCase";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../../src/domain/repositories/ICategoryRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../../src/domain/repositories/ITransactionRepository";

const makeTransactionRepo = (
  overrides: Partial<ITransactionRepository> = {},
): ITransactionRepository => ({
  findById: async () => null,
  findByMonth: async () => [],
  findByPersonAndMonth: async () => [],
  findByYear: async () => [],
  findByPersonAndYear: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }) as TransactionRecord,
  update: async (id, fields) =>
    ({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      personId: "",
      type: "INVESTMENT",
      amount: 0,
      date: new Date(),
      description: "",
      paymentMethod: null,
      source: null,
      categoryId: null,
      ...fields,
    }) as TransactionRecord,
  delete: async () => {},
  ...overrides,
});

const makeCategoryRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  findRootByName: async (name) =>
    categories.find((c) => c.parentId === null && c.name === name) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const leafCategory: CategoryRecord = {
  id: "cat-leaf",
  name: "Stocks",
  parentId: "cat-parent",
  level: 1,
  householdId: "default",
  createdAt: new Date(),
};

const parentCategory: CategoryRecord = {
  id: "cat-parent",
  name: "Investments",
  parentId: null,
  level: 0,
  householdId: "default",
  createdAt: new Date(),
};

const baseInput = {
  id: "inv-1",
  personId: "person-1",
  amount: 1000,
  date: new Date("2026-05-01"),
  description: "Monthly contribution",
  categoryId: "cat-leaf",
};

describe("CreateInvestmentUseCase", () => {
  it("saves and returns the investment", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createInvestmentUseCase(baseInput, transactionRepo, categoryRepo);

    expect(result.record.id).toBe("inv-1");
    expect(result.record.type).toBe("INVESTMENT");
    expect(result.record.amount).toBe(1000);
    expect(result.isDuplicate).toBe(false);
  });

  it("throws when categoryId is a non-leaf category", async () => {
    const transactionRepo = makeTransactionRepo();
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    await expect(
      createInvestmentUseCase(
        { ...baseInput, categoryId: "cat-parent" },
        transactionRepo,
        categoryRepo,
      ),
    ).rejects.toThrow("Investment must use the most specific category");
  });

  it("returns isDuplicate=true when same amount and date exist for the same type", async () => {
    const existing: TransactionRecord = {
      id: "inv-existing",
      personId: "person-1",
      type: "INVESTMENT",
      amount: 1000,
      date: new Date("2026-05-01"),
      description: "Other contribution",
      paymentMethod: null,
      source: null,
      categoryId: "cat-leaf",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepo = makeTransactionRepo({
      findByPersonAndMonth: async () => [existing],
    });
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createInvestmentUseCase(baseInput, transactionRepo, categoryRepo);
    expect(result.isDuplicate).toBe(true);
    expect(result.record.id).toBe("inv-1");
  });

  it("returns isDuplicate=false when same amount but different day", async () => {
    const existing: TransactionRecord = {
      id: "inv-existing",
      personId: "person-1",
      type: "INVESTMENT",
      amount: 1000,
      date: new Date("2026-06-10"),
      description: "Other contribution",
      paymentMethod: null,
      source: null,
      categoryId: "cat-leaf",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepo = makeTransactionRepo({
      findByPersonAndMonth: async () => [existing],
    });
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createInvestmentUseCase(baseInput, transactionRepo, categoryRepo);
    expect(result.isDuplicate).toBe(false);
  });

  it("does not match a duplicate against an EXPENSE of the same amount and date", async () => {
    const existing: TransactionRecord = {
      id: "exp-existing",
      personId: "person-1",
      type: "EXPENSE",
      amount: 1000,
      date: new Date("2026-05-01"),
      description: "Unrelated expense",
      paymentMethod: "CASH",
      source: null,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transactionRepo = makeTransactionRepo({
      findByPersonAndMonth: async () => [existing],
    });
    const categoryRepo = makeCategoryRepo([parentCategory, leafCategory]);

    const result = await createInvestmentUseCase(baseInput, transactionRepo, categoryRepo);
    expect(result.isDuplicate).toBe(false);
  });
});
