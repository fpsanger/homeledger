import { useState } from "react";
import { type BulkRow, createEmptyRow } from "./types";

const EDITED: Partial<BulkRow> = { status: "pending", error: undefined, isDuplicate: undefined };

/** The normal section's rows: expenses and incomes, each with its own person. */
export function useNormalRows(defaultPersonId: string, today: string) {
  const [rows, setRows] = useState<BulkRow[]>(() => [createEmptyRow(defaultPersonId, today)]);

  function updateRow(clientId: string, patch: Partial<BulkRow>) {
    setRows((prev) => prev.map((r) => (r.clientId === clientId ? { ...r, ...patch } : r)));
  }

  return {
    rows,
    updateRow,
    editRow: (clientId: string, patch: Partial<BulkRow>) =>
      updateRow(clientId, { ...patch, ...EDITED }),
    addRow: () => setRows((prev) => [...prev, createEmptyRow(defaultPersonId, today)]),
    removeRow: (clientId: string) => setRows((prev) => prev.filter((r) => r.clientId !== clientId)),
  };
}

export type NormalRows = ReturnType<typeof useNormalRows>;
