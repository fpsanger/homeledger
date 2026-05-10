import { updateIncomeUseCase } from "../../../src/application/use-cases/UpdateIncomeUseCase";
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
    const repo = makeTransactionRepo();
    const result = await updateIncomeUseCase(baseInput, repo);
    expect(result.id).toBe("inc-1");
    expect(result.amount).toBe(3000);
    expect(result.source).toBe("SALARY");
  });

  it("calls repo.update with the correct fields", async () => {
    const updateFn = jest.fn(async (id: string, fields: Partial<Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">>) => ({
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
    }));
    const repo = makeTransactionRepo({ update: updateFn });
    await updateIncomeUseCase(baseInput, repo);
    expect(updateFn).toHaveBeenCalledWith("inc-1", expect.objectContaining({
      personId: "person-1",
      amount: 3000,
      source: "SALARY",
    }));
  });

  it("throws when personId is missing", async () => {
    const repo = makeTransactionRepo();
    await expect(updateIncomeUseCase({ ...baseInput, personId: "" }, repo)).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeTransactionRepo();
    await expect(updateIncomeUseCase({ ...baseInput, amount: 0 }, repo)).rejects.toThrow("Amount must be positive");
  });

  it("throws when amount is negative", async () => {
    const repo = makeTransactionRepo();
    await expect(updateIncomeUseCase({ ...baseInput, amount: -1 }, repo)).rejects.toThrow("Amount must be positive");
  });

  it("throws when source is invalid", async () => {
    const repo = makeTransactionRepo();
    await expect(
      updateIncomeUseCase({ ...baseInput, source: "INVALID" as any }, repo)
    ).rejects.toThrow("Invalid income source");
  });
});
