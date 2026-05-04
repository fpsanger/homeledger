import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";

export async function deleteCategoryUseCase(
  id: string,
  repo: ICategoryRepository,
): Promise<void> {
  const category = await repo.findById(id);
  if (!category) throw new Error("Category not found");
  await repo.delete(id);
}
