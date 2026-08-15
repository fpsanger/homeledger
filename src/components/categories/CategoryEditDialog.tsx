"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
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

  const validParents = categories.filter((c) => c.parentId === null && c.id !== category.id);
  const sorted = [...validParents].sort((a, b) => a.name.localeCompare(b.name));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao atualizar categoria.");
      return;
    }

    onClose();
    router.refresh();
    toast.success("Categoria atualizada.");
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
          <Label>Categoria pai</Label>
          <CategoryCombobox
            categories={sorted}
            value={parentId}
            onChange={setParentId}
            placeholder="Nenhuma (raiz)"
          />
        </div>
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
