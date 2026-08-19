import { parseCurrencyBR } from "@/lib/utils";
import type { PurchaseRow } from "./types";

export async function submitPurchase(
  personId: string,
  row: PurchaseRow,
  creditCardId: string,
): Promise<{ isDuplicate: boolean }> {
  const res = await fetch("/api/installments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personId,
      creditCardId,
      totalAmount: parseCurrencyBR(row.amount),
      numberOfInstallments: parseInt(row.numberOfInstallments, 10),
      purchaseDate: row.date,
      categoryId: row.categoryId || null,
      description: row.description,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Falha ao salvar compra.");
  }
  const data = await res.json();
  return { isDuplicate: Boolean(data.isDuplicate) };
}
