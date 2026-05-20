"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type Person = {
  id: string;
  name: string;
  createdAt: string;
};

export function PersonList({ people }: { people: Person[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
    toast.success("Pessoa excluída.");
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <Users className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma pessoa cadastrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Nome</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="font-medium text-sm">{person.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(person.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu
                  align="right"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      aria-label="Ações"
                      disabled={deletingId === person.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={[
                    {
                      label: deletingId === person.id ? "Excluindo..." : "Excluir",
                      onClick: () => handleDelete(person.id),
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
  );
}
