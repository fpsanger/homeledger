import type { IUserRepository, UserRecord } from "../../../src/domain/repositories/IUserRepository";

class MockUserRepository implements IUserRepository {
  async findById(_id: string): Promise<UserRecord | null> { return null; }
  async findByEmail(_email: string): Promise<UserRecord | null> { return null; }
  async save(user: Omit<UserRecord, "createdAt" | "updatedAt">): Promise<UserRecord> {
    return { ...user, createdAt: new Date(), updatedAt: new Date() };
  }
}

describe("IUserRepository interface", () => {
  it("can be implemented by a mock class", () => {
    const repo = new MockUserRepository();
    expect(repo).toBeDefined();
  });
});
