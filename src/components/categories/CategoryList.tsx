"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Category = {
  id: string;
  name: string;
  path: string;
  level: number;
  createdAt: string;
};

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = [...categories].sort((a, b) => a.path.localeCompare(b.path));

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
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Path</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((cat) => (
          <TableRow key={cat.id}>
            <TableCell style={{ paddingLeft: `${cat.level * 20 + 12}px` }} className="font-medium">
              {cat.name}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">{cat.path}</TableCell>
            <TableCell className="text-right">
              {errors[cat.id] && (
                <span className="text-sm text-destructive mr-3">{errors[cat.id]}</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting === cat.id}
                onClick={() => handleDelete(cat.id)}
              >
                {deleting === cat.id ? "Deleting…" : "Delete"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
