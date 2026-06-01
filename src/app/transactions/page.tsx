import { TransactionPageClient } from "@/components/transactions/TransactionPageClient";
import { PageHeader } from "@/components/ui/page-header";
import { cookies } from "next/headers";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };
type CreditCard = { id: string; name: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/api/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories;
}

async function getCreditCards(): Promise<CreditCard[]> {
  const res = await fetch(`${BASE_URL}/api/credit-cards`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards;
}

async function getMonthlyView(year: number, month: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/monthly-view?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return { transactions: [], installments: [] };
  return res.json();
}

type SearchParams = {
  year?: string;
  month?: string;
  personId?: string;
};

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const globalPersonId = cookies().get("global-person-id")?.value ?? "";
  const isGlobalLocked = !!globalPersonId;
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getUTCFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getUTCMonth() + 1;
  const personId = isGlobalLocked ? globalPersonId : (searchParams.personId ?? "");

  const [people, categories, creditCards, { transactions, installments }] = await Promise.all([
    getPeople(),
    getCategories(),
    getCreditCards(),
    getMonthlyView(year, month, personId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Finanças"
        title="Transações"
        description={
          transactions.length > 0 ? `${transactions.length} transações no mês` : undefined
        }
      />
      <TransactionPageClient
        year={year}
        month={month}
        people={people}
        currentPersonId={personId}
        isGlobalLocked={isGlobalLocked}
        categories={categories}
        creditCards={creditCards}
        transactions={transactions}
        installments={installments}
      />
    </div>
  );
}
