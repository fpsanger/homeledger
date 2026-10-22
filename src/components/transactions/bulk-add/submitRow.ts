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

function entryBody(row: BulkRow, typeSpecific: Record<string, string>) {
  return {
    personId: row.personId,
    amount: parseCurrencyBR(row.amount),
    date: row.date,
    ...typeSpecific,
    categoryId: row.categoryId || null,
    description: row.description,
  };
}

export async function submitRow(row: BulkRow): Promise<{ isDuplicate: boolean }> {
  if (row.type === "income") {
    return post("/api/incomes", entryBody(row, { source: row.source }));
  }
  return post("/api/expenses", entryBody(row, { paymentMethod: row.paymentMethod }));
}
