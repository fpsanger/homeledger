import { PendingTransactionsReview } from "@/components/pending-transactions/PendingTransactionsReview";
import { PageHeader } from "@/components/ui/page-header";

export default function PendingTransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Compras automáticas"
        title="A revisar"
        description="Confirme a categoria e a forma de pagamento das compras enviadas pelo iPhone"
      />
      <PendingTransactionsReview />
    </div>
  );
}
