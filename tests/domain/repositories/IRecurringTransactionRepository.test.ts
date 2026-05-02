import type { IRecurringTransactionRepository, RecurringTransactionRecord } from "../../../src/domain/repositories/IRecurringTransactionRepository";

class MockRecurringTransactionRepository implements IRecurringTransactionRepository {
  async findActiveByWorkspaceAndMonth(_workspaceId: string, _year: number, _month: number): Promise<RecurringTransactionRecord[]> { return []; }
  async save(r: Omit<RecurringTransactionRecord, "createdAt" | "updatedAt">): Promise<RecurringTransactionRecord> {
    return { ...r, createdAt: new Date(), updatedAt: new Date() };
  }
  async delete(_id: string): Promise<void> {}
}

describe("IRecurringTransactionRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockRecurringTransactionRepository()).toBeDefined();
  });
});
