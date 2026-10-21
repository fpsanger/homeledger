import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

class MockRecurringTransactionRepository implements IRecurringTransactionRepository {
  async findById(_id: string): Promise<RecurringTransactionRecord | null> {
    return null;
  }
  async findAll(_personId?: string): Promise<RecurringTransactionRecord[]> {
    return [];
  }
  async findActiveByPersonAndMonth(
    _personId: string,
    _year: number,
    _month: number,
  ): Promise<RecurringTransactionRecord[]> {
    return [];
  }
  async findAllActiveByMonth(_year: number, _month: number): Promise<RecurringTransactionRecord[]> {
    return [];
  }
  async save(
    r: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    return { ...r, createdAt: new Date(), updatedAt: new Date() };
  }
  async update(
    _id: string,
    _changes: Partial<RecurringTransactionRecord>,
  ): Promise<RecurringTransactionRecord> {
    return {} as RecurringTransactionRecord;
  }
  async saveSplit(
    _closed: Pick<RecurringTransactionRecord, "id" | "endDate">,
    next: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">,
  ): Promise<RecurringTransactionRecord> {
    return { ...next, createdAt: new Date(), updatedAt: new Date() };
  }
  async delete(_id: string): Promise<void> {}
}

describe("IRecurringTransactionRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockRecurringTransactionRepository()).toBeDefined();
  });

  it("exposes saveSplit for closing a rule and creating its replacement", async () => {
    const repo = new MockRecurringTransactionRepository();

    const created = await repo.saveSplit(
      { id: "rule-1", endDate: new Date(Date.UTC(2026, 3, 1)) },
      {
        id: "rule-2",
        personId: "person-1",
        type: "EXPENSE",
        amount: 600,
        description: "Rent",
        paymentMethod: "PIX",
        categoryId: null,
        frequency: "MONTHLY",
        startDate: new Date(Date.UTC(2026, 3, 1)),
        endDate: new Date(Date.UTC(2027, 0, 1)),
      },
    );

    expect(created.id).toBe("rule-2");
    expect(created.amount).toBe(600);
  });
});
