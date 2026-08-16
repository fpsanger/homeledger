import { updateRecurringTransactionUseCase } from "../../../src/application/use-cases/UpdateRecurringTransactionUseCase";
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
  findAll: async () => [existingRule],
  findActiveByPersonAndMonth: async () => [],
  findAllActiveByMonth: async () => [],
  save: async (r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() }),
  update: async (_id, changes) => ({ ...existingRule, ...changes }),
  delete: async () => {},
  ...overrides,
});

describe("UpdateRecurringTransactionUseCase", () => {
  it("closes the old rule with endDate=today", async () => {
    const today = new Date("2026-05-15");
    let closedId: string | null = null;
    let closedChanges: Partial<RecurringTransactionRecord> | null = null;

    const repo = makeRepo({
      update: async (id, changes) => {
        closedId = id;
        closedChanges = changes;
        return { ...existingRule, ...changes };
      },
    });

    await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, today },
      repo,
    );

    expect(closedId).toBe("rule-1");
    expect(closedChanges).not.toBeNull();
    expect((closedChanges as unknown as Partial<RecurringTransactionRecord>).endDate).toEqual(
      today,
    );
  });

  it("saves a new rule with updated values and startDate=today", async () => {
    const today = new Date("2026-05-15");
    let savedRule: RecurringTransactionRecord | null = null;

    const repo = makeRepo({
      save: async (r) => {
        savedRule = { ...r, createdAt: new Date(), updatedAt: new Date() };
        return savedRule;
      },
    });

    const result = await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, today },
      repo,
    );

    expect(savedRule).not.toBeNull();
    expect(result.id).toBe("rule-2");
    expect(result.amount).toBe(600);
    expect(result.startDate).toEqual(today);
    expect(result.endDate).toBeNull();
  });

  it("throws when rule is not found", async () => {
    const repo = makeRepo({ findById: async () => null });

    await expect(
      updateRecurringTransactionUseCase(
        { id: "nonexistent", newId: "rule-2", updates: { amount: 600 }, today: new Date() },
        repo,
      ),
    ).rejects.toThrow("Recurring transaction not found");
  });
});
