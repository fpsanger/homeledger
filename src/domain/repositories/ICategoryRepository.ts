export interface CategoryRecord {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  householdId: string;
  createdAt: Date;
}

export interface ICategoryRepository {
  findAll(): Promise<CategoryRecord[]>;
  findById(id: string): Promise<CategoryRecord | null>;
  findRootByName(name: string, householdId: string): Promise<CategoryRecord | null>;
  save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord>;
  delete(id: string): Promise<void>;
}
