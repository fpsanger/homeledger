import type {
  IRecurringTransactionRepository,
  RecurringTransactionRecord,
} from "../../../src/domain/repositories/IRecurringTransactionRepository";

class MockRecurringTransactionRepository implements IRecurringTransactionRepository {
  async findById(_id: string): Promise<RecurringTransactionRecord | null> {
    return null;
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
  async delete(_id: string): Promise<void> {}
}

describe("IRecurringTransactionRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockRecurringTransactionRepository()).toBeDefined();
  });
});
