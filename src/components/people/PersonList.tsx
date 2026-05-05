import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Person = {
  id: string;
  name: string;
  createdAt: string;
};

export function PersonList({ people }: { people: Person[] }) {
  if (people.length === 0) {
    return <p className="text-sm text-muted-foreground">No people yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(person.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
