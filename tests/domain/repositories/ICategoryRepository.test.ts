import type { ICategoryRepository, CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";

class MockCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<CategoryRecord[]> { return []; }
  async findById(_id: string): Promise<CategoryRecord | null> { return null; }
  async save(c: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord> {
    return { ...c, createdAt: new Date() };
  }
  async delete(_id: string): Promise<void> {}
}

describe("ICategoryRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockCategoryRepository()).toBeDefined();
  });
});
