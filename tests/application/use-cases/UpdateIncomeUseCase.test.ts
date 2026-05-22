import { updateIncomeUseCase } from "../../../src/application/use-cases/UpdateIncomeUseCase";
import type {
  ICategoryRepository,
  CategoryRecord,
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
      type: "INCOME",
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
  overrides = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  findRootByName: async (name) =>
    categories.find((c) => c.parentId === null && c.name === name) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const existingRecord: TransactionRecord = {
  id: "inc-1",
  personId: "person-1",
  type: "INCOME",
  amount: 3000,
  date: new Date("2026-05-01"),
  description: "Monthly salary",
  paymentMethod: null,
  source: "SALARY",
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRepoWithExisting = (overrides: Partial<ITransactionRepository> = {}) =>
  makeTransactionRepo({ findById: async () => existingRecord, ...overrides });

const baseInput = {
  id: "inc-1",
  personId: "person-1",
  amount: 3000,
  date: new Date("2026-05-01"),
  description: "Monthly salary",
  source: "SALARY" as const,
  categoryId: null as string | null,
};

describe("UpdateIncomeUseCase", () => {
  it("updates and returns the income", async () => {
    const repo = makeRepoWithExisting();
    const result = await updateIncomeUseCase(baseInput, repo, makeCategoryRepo());
    expect(result.id).toBe("inc-1");
    expect(result.amount).toBe(3000);
    expect(result.source).toBe("SALARY");
  });

  it("calls repo.update with the correct fields", async () => {
    const updateFn = jest.fn(
      async (
        id: string,
        fields: Partial<Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">>,
      ) => ({
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: "",
        type: "INCOME" as const,
        amount: 0,
        date: new Date(),
        description: "",
        paymentMethod: null,
        source: null,
        categoryId: null,
        ...fields,
      }),
    );
    const repo = makeRepoWithExisting({ update: updateFn });
    await updateIncomeUseCase(baseInput, repo, makeCategoryRepo());
    expect(updateFn).toHaveBeenCalledWith(
      "inc-1",
      expect.objectContaining({
        personId: "person-1",
        amount: 3000,
        source: "SALARY",
      }),
    );
  });

  it("throws when personId is missing", async () => {
    const repo = makeRepoWithExisting();
    await expect(
      updateIncomeUseCase({ ...baseInput, personId: "" }, repo, makeCategoryRepo()),
    ).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeRepoWithExisting();
    await expect(
      updateIncomeUseCase({ ...baseInput, amount: 0 }, repo, makeCategoryRepo()),
    ).rejects.toThrow("Amount must be positive");
  });

  it("throws when amount is negative", async () => {
    const repo = makeRepoWithExisting();
    await expect(
      updateIncomeUseCase({ ...baseInput, amount: -1 }, repo, makeCategoryRepo()),
    ).rejects.toThrow("Amount must be positive");
  });

  it("throws when source is invalid", async () => {
    const repo = makeRepoWithExisting();
    await expect(
      updateIncomeUseCase({ ...baseInput, source: "INVALID" as any }, repo, makeCategoryRepo()),
    ).rejects.toThrow("Invalid income source");
  });

  it("throws when transaction does not exist", async () => {
    const repo = makeTransactionRepo({ findById: async () => null });
    await expect(updateIncomeUseCase(baseInput, repo, makeCategoryRepo())).rejects.toThrow(
      "Transaction not found",
    );
  });

  it("throws when categoryId is set and category does not exist", async () => {
    const repo = makeRepoWithExisting();
    const categoryRepo = makeCategoryRepo([]);
    await expect(
      updateIncomeUseCase({ ...baseInput, categoryId: "non-existent-cat" }, repo, categoryRepo),
    ).rejects.toThrow();
  });
});
