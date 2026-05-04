import { createCategoryUseCase } from "../../../src/application/use-cases/CreateCategoryUseCase";
import type { ICategoryRepository, CategoryRecord } from "../../../src/domain/repositories/ICategoryRepository";

const makeRepo = (
  categories: CategoryRecord[] = [],
  overrides: Partial<ICategoryRepository> = {},
): ICategoryRepository => ({
  findAll: async () => categories,
  findById: async (id) => categories.find((c) => c.id === id) ?? null,
  save: async (c) => ({ ...c, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

describe("createCategoryUseCase", () => {
  it("creates a root category when parentId is null", async () => {
    const repo = makeRepo();
    const result = await createCategoryUseCase(
      { id: "cat-1", name: "Food", parentId: null, householdId: "default" },
      repo,
    );
    expect(result.name).toBe("Food");
    expect(result.path).toBe("Food");
    expect(result.level).toBe(0);
  });

  it("creates a child category with correct path and level", async () => {
    const parent: CategoryRecord = {
      id: "cat-parent",
      name: "Food",
      parentId: null,
      path: "Food",
      level: 0,
      householdId: "default",
      createdAt: new Date(),
    };
    const repo = makeRepo([parent]);
    const result = await createCategoryUseCase(
      { id: "cat-child", name: "Restaurants", parentId: "cat-parent", householdId: "default" },
      repo,
    );
    expect(result.path).toBe("Food/Restaurants");
    expect(result.level).toBe(1);
  });

  it("throws when parentId does not exist", async () => {
    const repo = makeRepo([]);
    await expect(
      createCategoryUseCase(
        { id: "cat-1", name: "Child", parentId: "nonexistent", householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Parent category not found");
  });

  it("throws when name is empty", async () => {
    const repo = makeRepo();
    await expect(
      createCategoryUseCase(
        { id: "cat-1", name: "", parentId: null, householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Name is required");
  });
});
