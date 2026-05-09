import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryList } from "@/components/categories/CategoryList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CategoryRecord = {
  id: string;
  name: string;
  path: string;
  level: number;
  createdAt: string;
};

async function getCategories(): Promise<CategoryRecord[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/categories`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm categories={categories} />
        </CardContent>
      </Card>
      <Separator />
      <CategoryList categories={categories} />
    </div>
  );
}
