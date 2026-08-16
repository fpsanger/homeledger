import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../domain/repositories/ICategoryRepository";

export async function listCategoriesUseCase(repo: ICategoryRepository): Promise<CategoryRecord[]> {
  return repo.findAll();
}
