import type { IUserRepository } from "../../../src/domain/repositories/IUserRepository";

class MockUserRepository implements IUserRepository {
  async findById(_id: string) { return null; }
  async findByEmail(_email: string) { return null; }
  async save(user: { id: string; email: string; name: string; passwordHash: string }) {
    return { ...user, createdAt: new Date(), updatedAt: new Date() };
  }
}

describe("IUserRepository interface", () => {
  it("can be implemented by a mock class", () => {
    const repo = new MockUserRepository();
    expect(repo).toBeDefined();
  });
});
