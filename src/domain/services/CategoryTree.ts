import type { CategoryRecord } from "../repositories/ICategoryRepository";

export function canDeleteCategory(categoryId: string, categories: CategoryRecord[]): boolean {
  return !categories.some((c) => c.parentId === categoryId);
}

export function isLeafCategory(categoryId: string, categories: CategoryRecord[]): boolean {
  return canDeleteCategory(categoryId, categories);
}

export function validateExpenseCategory(
  categoryId: string | null,
  categories: CategoryRecord[],
): void {
  if (categoryId === null) return;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Category not found");

  if (!isLeafCategory(categoryId, categories)) {
    throw new Error("Expense must use the most specific category");
  }
}

export function validateIncomeCategory(
  categoryId: string | null,
  categories: CategoryRecord[],
): void {
  if (categoryId === null) return;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Category not found");

  if (!isLeafCategory(categoryId, categories)) {
    throw new Error("Income must use the most specific category");
  }
}

export function validateInvestmentCategory(categoryId: string, categories: CategoryRecord[]): void {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Category not found");

  if (!isLeafCategory(categoryId, categories)) {
    throw new Error("Investment must use the most specific category");
  }
}
