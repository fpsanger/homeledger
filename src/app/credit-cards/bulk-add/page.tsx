import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { BulkAddCreditCardPurchaseClient } from "@/components/credit-cards/bulk-add/BulkAddCreditCardPurchaseClient";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };
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

export default async function BulkAddCreditCardPage() {
  const globalPersonId = cookies().get("global-person-id")?.value ?? "";

  const [people, categories, creditCards] = await Promise.all([
    getPeople(),
    getCategories(),
    getCreditCards(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Crédito"
        title="Adicionar Compra em Lote"
        description="Aplique a mesma compra a vários cartões de crédito de uma vez."
      >
        <Link
          href="/transactions"
          className={buttonVariants({ variant: "outline", className: "gap-1.5" })}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </PageHeader>
      <BulkAddCreditCardPurchaseClient
        people={people}
        categories={categories}
        creditCards={creditCards}
        defaultPersonId={globalPersonId}
      />
    </div>
  );
}
