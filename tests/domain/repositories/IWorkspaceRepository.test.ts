import type { IWorkspaceRepository, WorkspaceRecord, WorkspaceMemberRecord } from "../../../src/domain/repositories/IWorkspaceRepository";

class MockWorkspaceRepository implements IWorkspaceRepository {
  async findById(_id: string): Promise<WorkspaceRecord | null> { return null; }
  async findByUserId(_userId: string): Promise<WorkspaceRecord[]> { return []; }
  async save(w: Omit<WorkspaceRecord, "createdAt" | "updatedAt">): Promise<WorkspaceRecord> {
    return { ...w, createdAt: new Date(), updatedAt: new Date() };
  }
  async addMember(m: Omit<WorkspaceMemberRecord, "joinedAt">): Promise<WorkspaceMemberRecord> {
    return { ...m, joinedAt: new Date() };
  }
  async findMember(_workspaceId: string, _userId: string): Promise<WorkspaceMemberRecord | null> { return null; }
}

describe("IWorkspaceRepository interface", () => {
  it("can be implemented by a mock class", () => {
    expect(new MockWorkspaceRepository()).toBeDefined();
  });
});
