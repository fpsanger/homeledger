import { createCategory } from "../../domain/entities/Category";
import { DuplicateCategoryError } from "../../domain/errors";
import type {
  ICategoryRepository,
  CategoryRecord,
} from "../../domain/repositories/ICategoryRepository";

type Input = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
};

export async function createCategoryUseCase(
  input: Input,
  repo: ICategoryRepository,
): Promise<CategoryRecord> {
  let parent: { path: string; level: number } | null = null;

  if (input.parentId !== null) {
    const parentRecord = await repo.findById(input.parentId);
    if (!parentRecord) throw new Error("Parent category not found");
    parent = { path: parentRecord.path, level: parentRecord.level };
  } else {
    const existing = await repo.findRootByName(input.name.trim(), input.householdId);
    if (existing) throw new DuplicateCategoryError(input.name.trim());
  }

  const category = createCategory({ ...input, parent });
  return repo.save(category);
}
