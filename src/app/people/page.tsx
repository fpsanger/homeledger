import { PersonForm } from "@/components/people/PersonForm";
import { PersonList } from "@/components/people/PersonList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader eyebrow="Configurações" title="Pessoas" description={people.length > 0 ? `${people.length} pessoas cadastradas` : undefined} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Pessoa</CardTitle>
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
