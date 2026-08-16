import { createCategoryUseCase } from "../../../src/application/use-cases/CreateCategoryUseCase";
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

describe("createCategoryUseCase", () => {
  it("creates a root category when parentId is null", async () => {
    const repo = makeRepo();
    const result = await createCategoryUseCase(
      { id: "cat-1", name: "Food", parentId: null, householdId: "default" },
      repo,
    );
    expect(result.name).toBe("Food");
    expect(result.level).toBe(0);
  });

  it("creates a child category with correct level", async () => {
    const parent: CategoryRecord = {
      id: "cat-parent",
      name: "Food",
      parentId: null,
      level: 0,
      householdId: "default",
      createdAt: new Date(),
    };
    const repo = makeRepo([parent]);
    const result = await createCategoryUseCase(
      { id: "cat-child", name: "Restaurants", parentId: "cat-parent", householdId: "default" },
      repo,
    );
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

  it("throws DuplicateCategoryError when root category with same name exists", async () => {
    const existing: CategoryRecord = {
      id: "cat-existing",
      name: "Food",
      parentId: null,
      level: 0,
      householdId: "default",
      createdAt: new Date(),
    };
    const repo = makeRepo([existing]);
    await expect(
      createCategoryUseCase(
        { id: "cat-new", name: "Food", parentId: null, householdId: "default" },
        repo,
      ),
    ).rejects.toThrow("Food");
  });

  it("allows child category with same name as existing root", async () => {
    const root: CategoryRecord = {
      id: "cat-root",
      name: "Food",
      parentId: null,
      level: 0,
      householdId: "default",
      createdAt: new Date(),
    };
    const repo = makeRepo([root]);
    const result = await createCategoryUseCase(
      { id: "cat-child", name: "Food", parentId: "cat-root", householdId: "default" },
      repo,
    );
    expect(result.level).toBe(1);
  });
});
