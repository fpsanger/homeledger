import type { CategoryRecord } from "../repositories/ICategoryRepository";

export type CategoryTreeNode = {
  category: CategoryRecord;
  children: CategoryTreeNode[];
};

export function isCircularReference(
  categoryId: string,
  newParentId: string,
  categories: CategoryRecord[],
): boolean {
  if (categoryId === newParentId) return true;

  // Walk the ancestor chain of newParentId upward.
  // If we encounter categoryId, moving categoryId there would create a cycle.
  const byId = new Map(categories.map((c) => [c.id, c]));
  let current = byId.get(newParentId);
  while (current) {
    if (current.id === categoryId) return true;
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }
  return false;
}

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

export function computeUpdatedPaths(
  categoryId: string,
  newParent: CategoryRecord | null,
  categories: CategoryRecord[],
): CategoryRecord[] {
  const target = categories.find((c) => c.id === categoryId);
  if (!target) return categories;

  const newPath = newParent ? `${newParent.path}/${target.name}` : target.name;
  const newLevel = newParent ? newParent.level + 1 : 0;

  const updatedTarget: CategoryRecord = {
    ...target,
    parentId: newParent?.id ?? null,
    path: newPath,
    level: newLevel,
  };

  const withUpdatedTarget = categories.map((c) => (c.id === categoryId ? updatedTarget : c));

  return cascadeDescendants(categoryId, updatedTarget, withUpdatedTarget);
}

function cascadeDescendants(
  parentId: string,
  updatedParent: CategoryRecord,
  categories: CategoryRecord[],
): CategoryRecord[] {
  const children = categories.filter((c) => c.parentId === parentId);
  let result = categories;

  for (const child of children) {
    const updatedChild: CategoryRecord = {
      ...child,
      path: `${updatedParent.path}/${child.name}`,
      level: updatedParent.level + 1,
    };
    result = result.map((c) => (c.id === child.id ? updatedChild : c));
    result = cascadeDescendants(child.id, updatedChild, result);
  }

  return result;
}

export function buildCategoryTree(categories: CategoryRecord[]): CategoryTreeNode[] {
  const roots = categories.filter((c) => c.parentId === null);
  return roots.map((root) => buildNode(root, categories));
}

function buildNode(category: CategoryRecord, all: CategoryRecord[]): CategoryTreeNode {
  const children = all
    .filter((c) => c.parentId === category.id)
    .map((child) => buildNode(child, all));
  return { category, children };
}
