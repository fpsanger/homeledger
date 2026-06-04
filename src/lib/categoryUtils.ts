type CategoryLike = { id: string; name: string; parentId: string | null };

export function getFullPath(id: string, categories: CategoryLike[]): string {
  const map = new Map(categories.map((c) => [c.id, c]));
  const parts: string[] = [];
  let current = map.get(id);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return parts.join("/");
}
