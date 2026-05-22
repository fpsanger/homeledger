import { createRecurringTransactionUseCase } from "../../../src/application/use-cases/CreateRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

const makeRepo = (
  overrides: Partial<IRecurringTransactionRepository> = {},
): IRecurringTransactionRepository => ({
  findById: async () => null,
  findActiveByPersonAndMonth: async () => [],
  findAllActiveByMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (id, changes) => ({ id, ...changes }) as RecurringTransactionRecord,
  delete: async () => {},
  ...overrides,
});

const baseInput = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX" as const,
  categoryId: null,
  frequency: "MONTHLY" as const,
  startDate: new Date("2026-05-01"),
  endDate: null,
};

describe("CreateRecurringTransactionUseCase", () => {
  it("saves the rule via the repository and returns it", async () => {
    let saved: RecurringTransactionRecord | null = null;
    const repo = makeRepo({
      save: async (r) => {
        saved = { ...r, createdAt: new Date(), updatedAt: new Date() };
        return saved;
      },
    });

    const result = await createRecurringTransactionUseCase(baseInput, repo);

    expect(saved).not.toBeNull();
    expect(result.id).toBe("rule-1");
    expect(result.amount).toBe(500);
    expect(result.frequency).toBe("MONTHLY");
  });

  it("throws when personId is missing", async () => {
    const repo = makeRepo();

    await expect(
      createRecurringTransactionUseCase({ ...baseInput, personId: "" }, repo),
    ).rejects.toThrow("Person is required");
  });

  it("throws when amount is not positive", async () => {
    const repo = makeRepo();

    await expect(
      createRecurringTransactionUseCase({ ...baseInput, amount: 0 }, repo),
    ).rejects.toThrow("Amount must be positive");
  });
});
