"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, List, MoreHorizontal, Plus, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryCreateDialog } from "./CategoryCreateDialog";
import { CategoryEditDialog } from "./CategoryEditDialog";

type Category = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  level: number;
  createdAt: string;
};

type ViewMode = "cards" | "table";

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("cards");

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);

  const { roots, childrenOf } = useMemo(() => {
    const roots = categories
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name));
    const childrenOf = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentId) {
        const arr = childrenOf.get(c.parentId) ?? [];
        arr.push(c);
        childrenOf.set(c.parentId, arr);
      }
    }
    childrenOf.forEach((v, k) =>
      childrenOf.set(
        k,
        v.sort((a, b) => a.name.localeCompare(b.name)),
      ),
    );
    return { roots, childrenOf };
  }, [categories]);

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return roots.map((root) => ({ root, children: childrenOf.get(root.id) ?? [] }));
    return roots
      .map((root) => {
        const children = childrenOf.get(root.id) ?? [];
        const rootMatches = root.name.toLowerCase().includes(q);
        if (rootMatches) return { root, children };
        const matchedChildren = children.filter((c) => c.name.toLowerCase().includes(q));
        if (matchedChildren.length > 0) return { root, children: matchedChildren };
        return null;
      })
      .filter(Boolean) as { root: Category; children: Category[] }[];
  }, [roots, childrenOf, query]);

  const flatFiltered = useMemo(() => {
    const q = query.toLowerCase();
    const result: Category[] = [];
    for (const root of roots) {
      const children = childrenOf.get(root.id) ?? [];
      if (!q) {
        result.push(root, ...children);
      } else {
        const rootMatches = root.name.toLowerCase().includes(q);
        const matchedChildren = children.filter((c) => c.name.toLowerCase().includes(q));
        if (rootMatches) result.push(root, ...children);
        else if (matchedChildren.length > 0) result.push(root, ...matchedChildren);
      }
    }
    return result;
  }, [roots, childrenOf, query]);

  const totalPages = Math.ceil(flatFiltered.length / PAGE_SIZE);
  const paged = flatFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success("Categoria excluída.");
  }

  function openCreate(parentId?: string) {
    setCreateParentId(parentId);
    setCreating(true);
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Filtrar por nome…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(0);
        }}
        className="flex-1 min-w-0 max-w-xs"
      />
      <div className="flex items-center border rounded-md overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => setView("cards")}
          className={`p-2 transition-colors ${
            view === "cards"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          aria-label="Visualização em cards"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setView("table")}
          className={`p-2 transition-colors ${
            view === "table"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          aria-label="Visualização em tabela"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <Button size="sm" onClick={() => openCreate()} className="shrink-0 whitespace-nowrap">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Categoria
      </Button>
    </div>
  );

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {toolbar}
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Tags className="w-8 h-8 opacity-30" />
          <p className="text-sm">Nenhuma categoria cadastrada</p>
          <Button variant="outline" size="sm" onClick={() => openCreate()} className="mt-2">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nova Categoria
          </Button>
        </div>
        {creating && (
          <CategoryCreateDialog
            open
            onClose={() => setCreating(false)}
            categories={categories}
            defaultParentId={createParentId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toolbar}

      {/* ── CARDS VIEW ── */}
      {view === "cards" && (
        <>
          {filteredGroups.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma categoria encontrada
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(({ root, children }) => (
                <Card key={root.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-sm leading-tight truncate">
                          {root.name}
                        </span>
                        <Badge variant="secondary" className="w-fit text-xs font-normal">
                          {(childrenOf.get(root.id) ?? []).length}{" "}
                          {(childrenOf.get(root.id) ?? []).length === 1
                            ? "subcategoria"
                            : "subcategorias"}
                        </Badge>
                      </div>
                      <DropdownMenu
                        align="right"
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 w-7 p-0 shrink-0"
                            aria-label="Ações"
                            disabled={deleting === root.id}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        }
                        items={[
                          { label: "Editar", onClick: () => setEditing(root) },
                          {
                            label: "Adicionar subcategoria",
                            onClick: () => openCreate(root.id),
                          },
                          {
                            label: deleting === root.id ? "Excluindo…" : "Excluir",
                            onClick: () => handleDelete(root.id),
                            variant: "destructive",
                          },
                        ]}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex-1">
                    {children.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                        <p className="text-xs">Nenhuma subcategoria</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => openCreate(root.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Adicionar subcategoria
                        </Button>
                      </div>
                    ) : (
                      <ul className="flex flex-col divide-y divide-border">
                        {children.map((child) => (
                          <li
                            key={child.id}
                            className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0"
                          >
                            <span className="text-sm text-muted-foreground truncate">
                              {child.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <DropdownMenu
                                align="right"
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground h-6 w-6 p-0"
                                    aria-label="Ações"
                                    disabled={deleting === child.id}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                }
                                items={[
                                  { label: "Editar", onClick: () => setEditing(child) },
                                  {
                                    label: deleting === child.id ? "Excluindo…" : "Excluir",
                                    onClick: () => handleDelete(child.id),
                                    variant: "destructive",
                                  },
                                ]}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TABLE VIEW ── */}
      {view === "table" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead>Caminho</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      Nenhuma categoria encontrada
                    </TableCell>
                  </TableRow>
                )}
                {paged.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell
                      style={{ paddingLeft: `${cat.level * 20 + 12}px` }}
                      className="font-medium text-sm"
                    >
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cat.path || cat.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu
                        align="right"
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 w-7 p-0"
                            aria-label="Ações"
                            disabled={deleting === cat.id}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        }
                        items={[
                          { label: "Editar", onClick: () => setEditing(cat) },
                          {
                            label: deleting === cat.id ? "Excluindo…" : "Excluir",
                            onClick: () => handleDelete(cat.id),
                            variant: "destructive",
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Próximo →
              </Button>
            </div>
          )}
        </div>
      )}

      {editing && (
        <CategoryEditDialog
          category={editing}
          categories={categories}
          open
          onClose={() => setEditing(null)}
        />
      )}
      {creating && (
        <CategoryCreateDialog
          open
          onClose={() => setCreating(false)}
          categories={categories}
          defaultParentId={createParentId}
        />
      )}
    </div>
  );
}
