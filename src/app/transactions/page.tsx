import { TransactionTabs } from "@/components/transactions/TransactionTabs";
import { InstallmentForm } from "@/components/transactions/InstallmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default async function TransactionsPage() {
  const [people, categories, creditCards] = await Promise.all([getPeople(), getCategories(), getCreditCards()]);
  const leafCategories = categories.filter(
    (c) => !categories.some((other) => other.parentId === c.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTabs people={people} categories={leafCategories} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Credit Card Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <InstallmentForm people={people} categories={leafCategories} creditCards={creditCards} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
