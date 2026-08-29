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

async function ensureNoDuplicateRootName(
  repo: ICategoryRepository,
  name: string,
  id: string,
  householdId: string,
): Promise<void> {
  const existing = await repo.findRootByName(name.trim(), householdId);
  if (existing && existing.id !== id) throw new DuplicateCategoryError(name.trim());
}

async function resolveParent(
  repo: ICategoryRepository,
  parentId: string,
  id: string,
): Promise<{ level: number }> {
  if (parentId === id) throw new Error("Category cannot be its own parent");
  const parentRecord = await repo.findById(parentId);
  if (!parentRecord) throw new Error("Parent category not found");

  let cur: CategoryRecord | null = parentRecord;
  while (cur) {
    if (cur.id === id) throw new Error("Cannot move category under one of its own descendants");
    cur = cur.parentId ? await repo.findById(cur.parentId) : null;
  }

  return { level: parentRecord.level };
}

export async function updateCategoryUseCase(
  input: Input,
  repo: ICategoryRepository,
): Promise<CategoryRecord> {
  const existing = await repo.findById(input.id);
  if (!existing) throw new Error("Category not found");

  if (input.parentId === null) {
    await ensureNoDuplicateRootName(repo, input.name, input.id, input.householdId);
  }

  const parent =
    input.parentId !== null ? await resolveParent(repo, input.parentId, input.id) : null;

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
