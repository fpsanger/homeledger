import { NotFoundError } from "../../domain/errors";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";

export async function deleteCategoryUseCase(
  id: string,
  repo: ICategoryRepository,
): Promise<void> {
  const category = await repo.findById(id);
  if (!category) throw new NotFoundError("Category not found");
  await repo.delete(id);
}
