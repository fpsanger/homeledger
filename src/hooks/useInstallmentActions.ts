import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useInstallmentActions() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao excluir.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  async function handleMarkPaid(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/installments/${id}/paid`, { method: "PATCH" });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao marcar como pago.");
      return;
    }
    router.refresh();
    toast.success("Parcelamento atualizado.");
  }

  return { loadingId, handleDelete, handleMarkPaid };
}
