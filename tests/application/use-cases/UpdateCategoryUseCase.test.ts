import { updateCategoryUseCase } from "../../../src/application/use-cases/UpdateCategoryUseCase";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../../src/domain/repositories/ICategoryRepository";

const makeRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  findRootByName: async (name) =>
    categories.find((c) => c.parentId === null && c.name === name) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

const category = (overrides: Partial<CategoryRecord>): CategoryRecord => ({
  id: "cat-1",
  name: "Food",
  parentId: null,
  level: 0,
  householdId: "default",
  createdAt: new Date(),
  ...overrides,
});

describe("updateCategoryUseCase", () => {
  it("throws when category does not exist", async () => {
    const repo = makeRepo([]);
    await expect(
      updateCategoryUseCase(
        { id: "missing", name: "Food", parentId: null, householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Category not found");
  });

  it("throws DuplicateCategoryError when renaming to an existing root name", async () => {
    const target = category({ id: "cat-1", name: "Food" });
    const other = category({ id: "cat-2", name: "Transport" });
    const repo = makeRepo([target, other]);
    await expect(
      updateCategoryUseCase(
        { id: "cat-1", name: "Transport", parentId: null, householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Transport");
  });

  it("allows keeping its own root name unchanged", async () => {
    const target = category({ id: "cat-1", name: "Food" });
    const repo = makeRepo([target]);
    const result = await updateCategoryUseCase(
      { id: "cat-1", name: "Food", parentId: null, householdId: "default" },
      repo,
    );
    expect(result.name).toBe("Food");
    expect(result.level).toBe(0);
  });

  it("throws when parentId is the category itself", async () => {
    const target = category({ id: "cat-1" });
    const repo = makeRepo([target]);
    await expect(
      updateCategoryUseCase(
        { id: "cat-1", name: "Food", parentId: "cat-1", householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Category cannot be its own parent");
  });

  it("throws when parentId does not exist", async () => {
    const target = category({ id: "cat-1" });
    const repo = makeRepo([target]);
    await expect(
      updateCategoryUseCase(
        { id: "cat-1", name: "Food", parentId: "nonexistent", householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Parent category not found");
  });

  it("throws when moving a category under one of its own descendants", async () => {
    const root = category({ id: "cat-1", name: "Food", parentId: null, level: 0 });
    const child = category({ id: "cat-2", name: "Restaurants", parentId: "cat-1", level: 1 });
    const grandchild = category({ id: "cat-3", name: "Fast Food", parentId: "cat-2", level: 2 });
    const repo = makeRepo([root, child, grandchild]);
    await expect(
      updateCategoryUseCase(
        { id: "cat-1", name: "Food", parentId: "cat-3", householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Cannot move category under one of its own descendants");
  });

  it("moves a category under a valid new parent and recomputes level", async () => {
    const root = category({ id: "cat-1", name: "Food", parentId: null, level: 0 });
    const otherRoot = category({ id: "cat-2", name: "Transport", parentId: null, level: 0 });
    const repo = makeRepo([root, otherRoot]);
    const result = await updateCategoryUseCase(
      { id: "cat-1", name: "Food", parentId: "cat-2", householdId: "default" },
      repo,
    );
    expect(result.level).toBe(1);
  });
});
