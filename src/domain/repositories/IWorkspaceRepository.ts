export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  invitedById: string | null;
  joinedAt: Date;
}

export interface IWorkspaceRepository {
  findById(id: string): Promise<WorkspaceRecord | null>;
  findByUserId(userId: string): Promise<WorkspaceRecord[]>;
  save(workspace: Omit<WorkspaceRecord, "createdAt" | "updatedAt">): Promise<WorkspaceRecord>;
  addMember(member: Omit<WorkspaceMemberRecord, "joinedAt">): Promise<WorkspaceMemberRecord>;
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord | null>;
}
