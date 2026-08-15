"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PersonForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao criar pessoa.");
      return;
    }

    setName("");
    router.refresh();
    toast.success("Pessoa criada com sucesso.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="person-name">Nome</Label>
        <Input
          id="person-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Felipe"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando…" : "Adicionar Pessoa"}
      </Button>
    </form>
  );
}
