"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Person = {
  id: string;
  name: string;
  createdAt: string;
};

export function PersonList({ people }: { people: Person[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (people.length === 0) {
    return <p className="text-sm text-muted-foreground">No people yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(person.createdAt).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(person.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
