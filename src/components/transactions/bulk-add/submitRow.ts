import { parseCurrencyBR } from "@/lib/utils";
import type { BulkRow } from "./types";

async function post(url: string, body: unknown): Promise<{ isDuplicate: boolean }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Falha ao salvar linha.");
  }
  const data = await res.json();
  return { isDuplicate: Boolean(data.isDuplicate) };
}

export async function submitRow(row: BulkRow): Promise<{ isDuplicate: boolean }> {
  if (row.type === "expense") {
    return post("/api/expenses", {
      personId: row.personId,
      amount: parseCurrencyBR(row.amount),
      date: row.date,
      paymentMethod: row.paymentMethod,
      categoryId: row.categoryId || null,
      description: row.description,
    });
  }

  if (row.type === "income") {
    return post("/api/incomes", {
      personId: row.personId,
      amount: parseCurrencyBR(row.amount),
      date: row.date,
      source: row.source,
      categoryId: row.categoryId || null,
      description: row.description,
    });
  }

  return post("/api/installments", {
    personId: row.personId,
    creditCardId: row.creditCardId,
    totalAmount: parseCurrencyBR(row.amount),
    numberOfInstallments: parseInt(row.numberOfInstallments, 10),
    purchaseDate: row.date,
    categoryId: row.categoryId || null,
    description: row.description,
  });
}
