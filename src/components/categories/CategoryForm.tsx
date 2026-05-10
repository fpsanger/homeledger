"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  path: string;
};

export function CategoryForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...categories]
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar categoria.");
      return;
    }

    setName("");
    setParentId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
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
        <Label htmlFor="category-parent">Categoria pai</Label>
        <Select
          id="category-parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-48"
        >
          <option value="">Nenhuma (raiz)</option>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.path || c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando…" : "Adicionar Categoria"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
