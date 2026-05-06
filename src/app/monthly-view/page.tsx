import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { Separator } from "@/components/ui/separator";

type Person = { id: string; name: string };

async function getPeople(): Promise<Person[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/people`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getMonthlyView(year: number, month: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (personId) params.set("personId", personId);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/monthly-view?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { transactions: [], installments: [] };
  return res.json();
}

type SearchParams = { year?: string; month?: string; personId?: string };

export default async function MonthlyViewPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
  const personId = searchParams.personId ?? "";

  const [people, { transactions, installments }] = await Promise.all([
    getPeople(),
    getMonthlyView(year, month, personId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Monthly View</h1>
        <MonthNav year={year} month={month} people={people} currentPersonId={personId} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Transactions</h2>
        <TransactionTable transactions={transactions} people={people} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Installments</h2>
        <InstallmentTable installments={installments} />
      </section>
    </div>
  );
}
