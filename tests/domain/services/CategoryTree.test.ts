import {
  buildCategoryTree,
  canDeleteCategory,
  computeUpdatedPaths,
  isCircularReference,
  isLeafCategory,
  validateExpenseCategory,
  validateInvestmentCategory,
} from "../../../src/domain/services/CategoryTree";

type CategoryRecord = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
  path: string;
  level: number;
  createdAt: Date;
};

const makeCategory = (overrides: Partial<CategoryRecord> = {}): CategoryRecord => ({
  id: "cat-1",
  name: "Food",
  parentId: null,
  householdId: "household-1",
  path: "Food",
  level: 0,
  createdAt: new Date(),
  ...overrides,
});

const food = makeCategory({ id: "cat-1", name: "Food", path: "Food", level: 0 });
const restaurants = makeCategory({
  id: "cat-2",
  name: "Restaurants",
  parentId: "cat-1",
  path: "Food/Restaurants",
  level: 1,
});
const italian = makeCategory({
  id: "cat-3",
  name: "Italian",
  parentId: "cat-2",
  path: "Food/Restaurants/Italian",
  level: 2,
});
const transport = makeCategory({
  id: "cat-4",
  name: "Transport",
  path: "Transport",
  level: 0,
});

describe("CategoryTree service", () => {
  describe("isCircularReference", () => {
    it("returns false when no cycle exists", () => {
      const categories = [food, restaurants];

      expect(isCircularReference("cat-1", "cat-4", categories)).toBe(false);
    });

    it("returns true when category would become its own parent", () => {
      const categories = [food];

      expect(isCircularReference("cat-1", "cat-1", categories)).toBe(true);
    });

    it("returns true when category would become its own ancestor", () => {
      const categories = [food, restaurants, italian];

      // moving food under italian would create food → ... → food
      expect(isCircularReference("cat-1", "cat-3", categories)).toBe(true);
    });

    it("returns true when assigning parent creates a loop in chain", () => {
      const categories = [food, restaurants];

      // moving food under restaurants (a child of food) creates loop
      expect(isCircularReference("cat-1", "cat-2", categories)).toBe(true);
    });

    it("returns false when assigning sibling as parent", () => {
      const health = makeCategory({ id: "cat-5", name: "Health", path: "Health", level: 0 });
      const categories = [food, transport, health];

      expect(isCircularReference("cat-1", "cat-5", categories)).toBe(false);
    });
  });

  describe("canDeleteCategory", () => {
    it("returns true when category has no children", () => {
      const categories = [food, italian];

      expect(canDeleteCategory("cat-3", categories)).toBe(true);
    });

    it("returns false when category has children", () => {
      const categories = [food, restaurants, italian];

      expect(canDeleteCategory("cat-1", categories)).toBe(false);
    });

    it("returns false when category is an intermediate node with children", () => {
      const categories = [food, restaurants, italian];

      expect(canDeleteCategory("cat-2", categories)).toBe(false);
    });
  });

  describe("computeUpdatedPaths", () => {
    it("updates path when parent is reassigned", () => {
      const categories = [food, restaurants, italian, transport];
      // Move restaurants under transport
      const updated = computeUpdatedPaths("cat-2", transport, categories);

      const updatedRestaurants = updated.find((c) => c.id === "cat-2");
      expect(updatedRestaurants?.path).toBe("Transport/Restaurants");
      expect(updatedRestaurants?.level).toBe(1);
    });

    it("cascades path update to all descendants", () => {
      const categories = [food, restaurants, italian, transport];
      // Move restaurants under transport — italian must also update
      const updated = computeUpdatedPaths("cat-2", transport, categories);

      const updatedItalian = updated.find((c) => c.id === "cat-3");
      expect(updatedItalian?.path).toBe("Transport/Restaurants/Italian");
      expect(updatedItalian?.level).toBe(2);
    });

    it("updates path correctly when moving category to root (no parent)", () => {
      const categories = [food, restaurants, italian];
      // Promote restaurants to root
      const updated = computeUpdatedPaths("cat-2", null, categories);

      const updatedRestaurants = updated.find((c) => c.id === "cat-2");
      expect(updatedRestaurants?.path).toBe("Restaurants");
      expect(updatedRestaurants?.level).toBe(0);
    });

    it("cascades correctly when category promoted to root", () => {
      const categories = [food, restaurants, italian];
      const updated = computeUpdatedPaths("cat-2", null, categories);

      const updatedItalian = updated.find((c) => c.id === "cat-3");
      expect(updatedItalian?.path).toBe("Restaurants/Italian");
      expect(updatedItalian?.level).toBe(1);
    });
  });

  describe("buildCategoryTree", () => {
    it("returns root categories at top level", () => {
      const categories = [food, transport];
      const tree = buildCategoryTree(categories);

      expect(tree).toHaveLength(2);
      expect(tree.map((n) => n.category.id)).toContain("cat-1");
      expect(tree.map((n) => n.category.id)).toContain("cat-4");
    });

    it("nests children under their parent", () => {
      const categories = [food, restaurants];
      const tree = buildCategoryTree(categories);

      const foodNode = tree.find((n) => n.category.id === "cat-1");
      expect(foodNode?.children).toHaveLength(1);
      expect(foodNode?.children[0].category.id).toBe("cat-2");
    });

    it("nests multiple levels deep", () => {
      const categories = [food, restaurants, italian];
      const tree = buildCategoryTree(categories);

      const foodNode = tree.find((n) => n.category.id === "cat-1");
      const restaurantsNode = foodNode?.children.find((n) => n.category.id === "cat-2");
      expect(restaurantsNode?.children).toHaveLength(1);
      expect(restaurantsNode?.children[0].category.id).toBe("cat-3");
    });

    it("returns empty array for empty input", () => {
      const tree = buildCategoryTree([]);

      expect(tree).toHaveLength(0);
    });

    it("leaf nodes have empty children array", () => {
      const categories = [food, restaurants];
      const tree = buildCategoryTree(categories);

      const foodNode = tree.find((n) => n.category.id === "cat-1");
      const restaurantsNode = foodNode?.children[0];
      expect(restaurantsNode?.children).toHaveLength(0);
    });
  });
});

describe("Category-Expense integration", () => {
  const categories = [food, restaurants, italian, transport];

  describe("isLeafCategory", () => {
    it("returns true when category has no children", () => {
      expect(isLeafCategory("cat-3", categories)).toBe(true);
      expect(isLeafCategory("cat-4", categories)).toBe(true);
    });

    it("returns false when category has children", () => {
      expect(isLeafCategory("cat-1", categories)).toBe(false);
      expect(isLeafCategory("cat-2", categories)).toBe(false);
    });
  });

  describe("validateExpenseCategory", () => {
    it("passes when categoryId is null (category optional)", () => {
      expect(() => validateExpenseCategory(null, categories)).not.toThrow();
    });

    it("passes when categoryId points to a leaf category", () => {
      expect(() => validateExpenseCategory("cat-3", categories)).not.toThrow();
    });

    it("throws when categoryId does not exist in category list", () => {
      expect(() => validateExpenseCategory("cat-999", categories)).toThrow("Category not found");
    });

    it("throws when categoryId points to a non-leaf category", () => {
      expect(() => validateExpenseCategory("cat-1", categories)).toThrow(
        "Expense must use the most specific category",
      );
    });
  });

  describe("validateInvestmentCategory", () => {
    it("passes when categoryId points to a leaf category", () => {
      expect(() => validateInvestmentCategory("cat-3", categories)).not.toThrow();
    });

    it("throws when categoryId does not exist in category list", () => {
      expect(() => validateInvestmentCategory("cat-999", categories)).toThrow("Category not found");
    });

    it("throws when categoryId points to a non-leaf category", () => {
      expect(() => validateInvestmentCategory("cat-1", categories)).toThrow(
        "Investment must use the most specific category",
      );
    });
  });
});
