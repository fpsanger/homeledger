import { InstallmentsList } from "@/components/installments/InstallmentsList";
import { InstallmentsTabs } from "@/components/installments/InstallmentsTabs";
import { BillView } from "@/components/credit-cards/BillView";
import { PageHeader } from "@/components/ui/page-header";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPurchases(personId?: string) {
  const params = personId ? `?personId=${personId}` : "";
  const res = await fetch(`${BASE_URL}/api/credit-card-purchases${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.purchases;
}

async function getCategories() {
  const res = await fetch(`${BASE_URL}/api/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories ?? [];
}

async function getCreditCards() {
  const res = await fetch(`${BASE_URL}/api/credit-cards`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards ?? [];
}

export default async function InstallmentsPage() {
  const globalPersonId = cookies().get("global-person-id")?.value ?? "";
  const [purchases, categories, creditCards] = await Promise.all([
    getPurchases(globalPersonId || undefined),
    getCategories(),
    getCreditCards(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Crédito"
        title="Parcelas"
        description={purchases.length > 0 ? `${purchases.length} compras parceladas` : undefined}
      />
      <InstallmentsTabs
        defaultTab="purchases"
        purchasesView={
          <InstallmentsList
            purchases={purchases}
            currentPersonId={globalPersonId}
            categories={categories}
            creditCards={creditCards}
          />
        }
        billView={<BillView initialPersonId={globalPersonId} />}
      />
    </div>
  );
}
