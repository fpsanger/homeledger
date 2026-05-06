import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { InstallmentForm } from "@/components/expenses/InstallmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };

async function getPeople(): Promise<Person[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/people`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getCategories(): Promise<Category[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/categories`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories;
}

export default async function ExpensesPage() {
  const [people, categories] = await Promise.all([getPeople(), getCategories()]);
  const leafCategories = categories.filter(
    (c) => !categories.some((other) => other.parentId === c.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm people={people} categories={leafCategories} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Credit Card Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <InstallmentForm people={people} categories={leafCategories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
