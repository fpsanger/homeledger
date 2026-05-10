"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryEditDialog } from "./CategoryEditDialog";

type Category = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  level: number;
  createdAt: string;
};

const PAGE_SIZE = 12;

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [query, setQuery] = useState("");

  const sorted = [...categories]
    .sort((a, b) => (a.path || a.name).localeCompare(b.path || b.name))
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleDelete(id: string) {
    setErrors((prev) => ({ ...prev, [id]: "" }));
    setDeleting(id);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((prev) => ({ ...prev, [id]: data.error ?? "Failed to delete." }));
      return;
    }
    router.refresh();
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <Tags className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma categoria cadastrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Filtrar por nome…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(0); }}
        className="max-w-xs"
      />
      <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Nome</TableHead>
            <TableHead>Caminho</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell style={{ paddingLeft: `${cat.level * 20 + 12}px` }} className="font-medium text-sm">
                {cat.name}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{cat.path || cat.name}</TableCell>
              <TableCell className="text-right">
                {errors[cat.id] && (
                  <span className="text-sm text-destructive mr-3">{errors[cat.id]}</span>
                )}
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
                    {
                      label: "Editar",
                      onClick: () => setEditing(cat),
                    },
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

      {editing && (
        <CategoryEditDialog
          category={editing}
          categories={categories}
          open
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
