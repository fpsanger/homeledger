import { InstallmentsList } from "@/components/installments/InstallmentsList";
import { BillView } from "@/components/credit-cards/BillView";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type Person = { id: string; name: string };

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getPurchases(personId?: string) {
  const params = personId ? `?personId=${personId}` : "";
  const res = await fetch(`${BASE_URL}/api/credit-card-purchases${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.purchases;
}

type SearchParams = { personId?: string; view?: string };

export default async function InstallmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const personId = searchParams.personId ?? "";
  const view = searchParams.view ?? "purchases";
  const [people, purchases] = await Promise.all([
    getPeople(),
    getPurchases(personId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Installments</h1>
      <div className="flex gap-2">
        <a href={`/installments?view=purchases${personId ? `&personId=${personId}` : ""}`}
          className={`px-3 py-1 rounded text-sm ${view === "purchases" ? "bg-foreground text-background" : "border"}`}>
          All Purchases
        </a>
        <a href={`/installments?view=bill`}
          className={`px-3 py-1 rounded text-sm ${view === "bill" ? "bg-foreground text-background" : "border"}`}>
          Bill View
        </a>
      </div>
      {view === "bill" ? (
        <BillView />
      ) : (
        <InstallmentsList people={people} purchases={purchases} currentPersonId={personId} />
      )}
    </div>
  );
}
