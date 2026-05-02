import type { ITransactionRepository, TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";

class MockTransactionRepository implements ITransactionRepository {
  async findById(_id: string): Promise<TransactionRecord | null> { return null; }
  async findByWorkspaceAndMonth(_workspaceId: string, _year: number, _month: number): Promise<TransactionRecord[]> { return []; }
  async save(t: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord> {
    return { ...t, createdAt: new Date(), updatedAt: new Date() };
  }
  async delete(_id: string): Promise<void> {}
}

describe("ITransactionRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockTransactionRepository()).toBeDefined();
  });
});
