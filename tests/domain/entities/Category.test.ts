import { createCategory } from "../../../src/domain/entities/Category";

const baseCategory = {
  id: "cat-1",
  name: "Food",
  parentId: null,
  householdId: "household-1",
};

describe("Category entity", () => {
  describe("createCategory", () => {
    it("creates a root category with no parent", () => {
      const category = createCategory(baseCategory);

      expect(category.id).toBe("cat-1");
      expect(category.name).toBe("Food");
      expect(category.parentId).toBeNull();
    });

    it("creates a subcategory with a parent_id", () => {
      const category = createCategory({
        ...baseCategory,
        id: "cat-2",
        name: "Restaurants",
        parentId: "cat-1",
        parent: { level: 0 },
      });

      expect(category.parentId).toBe("cat-1");
    });

    it("requires a householdId", () => {
      expect(() => createCategory({ ...baseCategory, householdId: "" })).toThrow(
        "Household is required",
      );
    });

    it("does not accept workspaceId", () => {
      const category = createCategory(baseCategory);

      expect(category).not.toHaveProperty("workspaceId");
      expect(category).not.toHaveProperty("workspace_id");
    });

    it("throws when name is empty", () => {
      expect(() => createCategory({ ...baseCategory, name: "" })).toThrow("Name is required");
    });

    it("throws when name is only whitespace", () => {
      expect(() => createCategory({ ...baseCategory, name: "   " })).toThrow("Name is required");
    });

    it("trims whitespace from name", () => {
      const category = createCategory({ ...baseCategory, name: "  Food  " });

      expect(category.name).toBe("Food");
    });

    describe("level", () => {
      it("root category has level 0", () => {
        const category = createCategory(baseCategory);

        expect(category.level).toBe(0);
      });

      it("direct child has level 1", () => {
        const category = createCategory({
          ...baseCategory,
          id: "cat-2",
          name: "Restaurants",
          parentId: "cat-1",
          parent: { level: 0 },
        });

        expect(category.level).toBe(1);
      });

      it("grandchild has level 2", () => {
        const category = createCategory({
          ...baseCategory,
          id: "cat-3",
          name: "Italian",
          parentId: "cat-2",
          parent: { level: 1 },
        });

        expect(category.level).toBe(2);
      });
    });
  });
});
