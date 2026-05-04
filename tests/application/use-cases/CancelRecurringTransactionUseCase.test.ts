import { cancelRecurringTransactionUseCase } from "../../../src/application/use-cases/CancelRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

const existingRule: RecurringTransactionRecord = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRepo = (
  overrides: Partial<IRecurringTransactionRepository> = {},
): IRecurringTransactionRepository => ({
  findById: async () => existingRule,
  findActiveByPersonAndMonth: async () => [],
  findAllActiveByMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (_id, changes) => ({ ...existingRule, ...changes }),
  delete: async () => {},
  ...overrides,
});

describe("CancelRecurringTransactionUseCase", () => {
  it("calls update with the rule id and endDate set to today", async () => {
    const today = new Date("2026-05-15");
    let updatedId: string | null = null;
    let updatedChanges: Partial<RecurringTransactionRecord> | null = null;

    const repo = makeRepo({
      update: async (id, changes) => {
        updatedId = id;
        updatedChanges = changes;
        return { ...existingRule, ...changes };
      },
    });

    await cancelRecurringTransactionUseCase("rule-1", today, repo);

    expect(updatedId).toBe("rule-1");
    expect(updatedChanges?.endDate).toEqual(today);
  });

  it("throws when rule is not found", async () => {
    const repo = makeRepo({ findById: async () => null });

    await expect(
      cancelRecurringTransactionUseCase("nonexistent", new Date(), repo),
    ).rejects.toThrow("Recurring transaction not found");
  });
});
