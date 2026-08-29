import {
  canDeleteCategory,
  isLeafCategory,
  validateExpenseCategory,
  validateInvestmentCategory,
} from "../../../src/domain/services/CategoryTree";

type CategoryRecord = {
  id: string;
  name: string;
  parentId: string | null;
  householdId: string;
  level: number;
  createdAt: Date;
};

const makeCategory = (overrides: Partial<CategoryRecord> = {}): CategoryRecord => ({
  id: "cat-1",
  name: "Food",
  parentId: null,
  householdId: "household-1",
  level: 0,
  createdAt: new Date(),
  ...overrides,
});

const food = makeCategory({ id: "cat-1", name: "Food", level: 0 });
const restaurants = makeCategory({
  id: "cat-2",
  name: "Restaurants",
  parentId: "cat-1",
  level: 1,
});
const italian = makeCategory({
  id: "cat-3",
  name: "Italian",
  parentId: "cat-2",
  level: 2,
});
const transport = makeCategory({
  id: "cat-4",
  name: "Transport",
  level: 0,
});

describe("CategoryTree service", () => {
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
