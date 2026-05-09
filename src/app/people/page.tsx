import { PersonForm } from "@/components/people/PersonForm";
import { PersonList } from "@/components/people/PersonList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PersonRecord = {
  id: string;
  name: string;
  createdAt: string;
};

async function getPeople(): Promise<PersonRecord[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/people`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">People</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Person</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonForm />
        </CardContent>
      </Card>
      <Separator />
      <PersonList people={people} />
    </div>
  );
}
