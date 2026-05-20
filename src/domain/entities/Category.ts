import type { CategoryRecord } from "../repositories/ICategoryRepository";

type CreateCategoryInput = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
  parent?: { path: string; level: number } | null;
};

export function createCategory(input: CreateCategoryInput): CategoryRecord {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Name is required");
  }

  if (!input.householdId) {
    throw new Error("Household is required");
  }

  const path = input.parent?.path ? `${input.parent.path}/${name}` : name;
  const level = input.parent ? input.parent.level + 1 : 0;

  return {
    id: input.id,
    name,
    parentId: input.parentId,
    householdId: input.householdId,
    path,
    level,
    createdAt: new Date(),
  };
}
