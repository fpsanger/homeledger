import { CategoryList } from "@/components/categories/CategoryList";
import { PageHeader } from "@/components/ui/page-header";

type CategoryRecord = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
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
      <PageHeader
        eyebrow="Configurações"
        title="Categorias"
        description={
          categories.length > 0 ? `${categories.length} categorias cadastradas` : undefined
        }
      />
      <CategoryList categories={categories} />
    </div>
  );
}
