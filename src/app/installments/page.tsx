import { cookies } from "next/headers";
import { BillView } from "@/components/credit-cards/BillView";
import { PageHeader } from "@/components/ui/page-header";

export default async function InstallmentsPage() {
  const globalPersonId = cookies().get("global-person-id")?.value ?? "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Crédito"
        title="Fatura cartão"
        description="Visão da fatura do cartão de crédito"
      />
      <BillView initialPersonId={globalPersonId} />
    </div>
  );
}
