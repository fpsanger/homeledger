import { createCategory } from "../../domain/entities/Category";
import { DuplicateCategoryError } from "../../domain/errors";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../domain/repositories/ICategoryRepository";

type Input = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
};

export async function updateCategoryUseCase(
  input: Input,
  repo: ICategoryRepository,
): Promise<CategoryRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new Error("Category not found");

  let parent: { level: number } | null = null;

  if (input.parentId === null) {
    const existing = await repo.findRootByName(input.name.trim(), input.householdId);
    if (existing && existing.id !== input.id) throw new DuplicateCategoryError(input.name.trim());
  }

  if (input.parentId !== null) {
    if (input.parentId === input.id) throw new Error("Category cannot be its own parent");
    const parentRecord = await repo.findById(input.parentId);
    if (!parentRecord) throw new Error("Parent category not found");

    let cur: CategoryRecord | null = parentRecord;
    while (cur) {
      if (cur.id === input.id)
        throw new Error("Cannot move category under one of its own descendants");
      cur = cur.parentId ? await repo.findById(cur.parentId) : null;
    }

    parent = { level: parentRecord.level };
  }

  const updated = createCategory({
    id: input.id,
    name: input.name,
    parentId: input.parentId,
    householdId: input.householdId,
    parent,
  });

  const saved = await repo.save(updated);
  return saved;
}
