"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";

type Category = {
  id: string;
  name: string;
  path: string;
  parentId?: string | null;
  level: number;
};

type Props = {
  category: Category;
  categories: Category[];
  open: boolean;
  onClose: () => void;
};

export function CategoryEditDialog({ category, categories, open, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [parentId, setParentId] = useState(category.parentId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exclude self and descendants to prevent cycles
  const validParents = categories.filter(
    (c) => c.parentId === null && c.id !== category.id && !c.path.startsWith(category.path + "/"),
  );
  const sorted = [...validParents].sort((a, b) => a.name.localeCompare(b.name));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao atualizar categoria.");
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Editar Categoria">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-category-name">Nome</Label>
          <Input
            id="edit-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-category-parent">Categoria pai</Label>
          <Select
            id="edit-category-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Nenhuma (raiz)</option>
            {sorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.path || c.name}
              </option>
            ))}
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
