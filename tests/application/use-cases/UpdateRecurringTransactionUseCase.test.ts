import { updateRecurringTransactionUseCase } from "../../../src/application/use-cases/UpdateRecurringTransactionUseCase";
import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

// A 12-month series: January through December 2026 (endDate is exclusive).
const existingRule: RecurringTransactionRecord = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 500,
  description: "Rent",
  paymentMethod: "PIX",
  categoryId: null,
  frequency: "MONTHLY",
  startDate: new Date(Date.UTC(2026, 0, 1)),
  endDate: new Date(Date.UTC(2027, 0, 1)),
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
  saveSplit: async (_closed, next) => ({ ...next, createdAt: new Date(), updatedAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const april = { year: 2026, month: 4 };

describe("UpdateRecurringTransactionUseCase", () => {
  it("splits the series atomically at the effective month", async () => {
    let closed: { id: string; endDate: Date | null } | null = null;
    let next: RecurringTransactionRecord | null = null;

    const repo = makeRepo({
      saveSplit: async (c, n) => {
        closed = c;
        next = { ...n, createdAt: new Date(), updatedAt: new Date() };
        return next;
      },
      update: async () => {
        throw new Error("update must not be used for a split");
      },
    });

    const result = await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, effectiveFrom: april },
      repo,
    );

    expect(closed).toEqual({ id: "rule-1", endDate: new Date(Date.UTC(2026, 3, 1)) });
    expect(next).not.toBeNull();
    expect(result.id).toBe("rule-2");
    expect(result.amount).toBe(600);
    expect(result.startDate).toEqual(new Date(Date.UTC(2026, 3, 1)));
  });

  it("preserves the original end date so the series keeps its length", async () => {
    const result = await updateRecurringTransactionUseCase(
      { id: "rule-1", newId: "rule-2", updates: { amount: 600 }, effectiveFrom: april },
      makeRepo(),
    );

    expect(result.endDate).toEqual(new Date(Date.UTC(2027, 0, 1)));
  });

  it("updates in place when the effective month is the start month", async () => {
    let updatedId: string | null = null;
    let updatedChanges: Record<string, unknown> | null = null;

    const repo = makeRepo({
      update: async (id, changes) => {
        updatedId = id;
        updatedChanges = changes as Record<string, unknown>;
        return { ...existingRule, ...changes };
      },
      saveSplit: async () => {
        throw new Error("saveSplit must not be used for an in-place update");
      },
    });

    const result = await updateRecurringTransactionUseCase(
      {
        id: "rule-1",
        newId: "rule-2",
        updates: { amount: 600 },
        effectiveFrom: { year: 2026, month: 1 },
      },
      repo,
    );

    expect(updatedId).toBe("rule-1");
    expect(updatedChanges).toMatchObject({ amount: 600 });
    expect(result.id).toBe("rule-1");
    expect(result.amount).toBe(600);
  });

  it("rejects an effective month outside the series period", async () => {
    await expect(
      updateRecurringTransactionUseCase(
        {
          id: "rule-1",
          newId: "rule-2",
          updates: { amount: 600 },
          effectiveFrom: { year: 2027, month: 1 },
        },
        makeRepo(),
      ),
    ).rejects.toThrow("Effective month is outside the recurring transaction period");
  });

  it("rejects a non-positive amount", async () => {
    await expect(
      updateRecurringTransactionUseCase(
        { id: "rule-1", newId: "rule-2", updates: { amount: 0 }, effectiveFrom: april },
        makeRepo(),
      ),
    ).rejects.toThrow("Amount must be positive");
  });

  it("throws when rule is not found", async () => {
    const repo = makeRepo({ findById: async () => null });

    await expect(
      updateRecurringTransactionUseCase(
        { id: "nonexistent", newId: "rule-2", updates: { amount: 600 }, effectiveFrom: april },
        repo,
      ),
    ).rejects.toThrow("Recurring transaction not found");
  });
});
