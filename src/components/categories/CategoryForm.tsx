"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryCombobox } from "@/components/ui/category-combobox";

type Category = {
  id: string;
  name: string;
parentId: string | null;
};

type Props = {
  categories: Category[];
  defaultParentId?: string;
  onSuccess?: () => void;
};

export function CategoryForm({ categories, defaultParentId, onSuccess }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(defaultParentId ?? "");
  const [loading, setLoading] = useState(false);

  const sorted = [...categories]
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao criar categoria.");
      return;
    }

    setName("");
    setParentId(defaultParentId ?? "");
    onSuccess?.();
    router.refresh();
    toast.success("Categoria criada com sucesso.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Nome</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Alimentação"
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
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "Adicionando…" : "Adicionar Categoria"}
        </Button>
      </div>
    </form>
  );
}
