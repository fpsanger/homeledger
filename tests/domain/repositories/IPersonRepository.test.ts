import type { IPersonRepository, PersonRecord } from "../../../src/domain/repositories/IPersonRepository";

class MockPersonRepository implements IPersonRepository {
  async findAll(): Promise<PersonRecord[]> { return []; }
  async findById(_id: string): Promise<PersonRecord | null> { return null; }
  async save(p: Omit<PersonRecord, "createdAt">): Promise<PersonRecord> {
    return { ...p, createdAt: new Date() };
  }
  async delete(_id: string): Promise<void> {}
}

describe("IPersonRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockPersonRepository()).toBeDefined();
  });
});
