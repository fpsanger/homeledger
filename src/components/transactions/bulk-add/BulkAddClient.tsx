"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Category, Person } from "../types";
import { BulkAddRow } from "./BulkAddRow";
import { submitRow } from "./submitRow";
import { type BulkRow, createEmptyRow, validateRow } from "./types";

type CreditCard = { id: string; name: string };

type Props = {
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  defaultPersonId?: string;
};

export function BulkAddClient({ people, categories, creditCards, defaultPersonId = "" }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [rows, setRows] = useState<BulkRow[]>([createEmptyRow(defaultPersonId, today)]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  function updateRow(clientId: string, patch: Partial<BulkRow>) {
    setRows((prev) => prev.map((r) => (r.clientId === clientId ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow(defaultPersonId, today)]);
  }

  function removeRow(clientId: string) {
    setRows((prev) => prev.filter((r) => r.clientId !== clientId));
  }

  async function handleSubmitAll() {
    if (submitting) return;

    const toSubmit = rows.filter((r) => r.status !== "success");
    if (toSubmit.length === 0) {
      toast.error("Nenhuma linha para enviar.");
      return;
    }

    setSubmitting(true);
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < toSubmit.length; i++) {
      const row = toSubmit[i];
      setProgress({ current: i + 1, total: toSubmit.length });

      const validationError = validateRow(row);
      if (validationError) {
        updateRow(row.clientId, { status: "error", error: validationError });
        failed++;
        continue;
      }

      updateRow(row.clientId, { status: "loading", error: undefined });
      try {
        const { isDuplicate } = await submitRow(row);
        updateRow(row.clientId, { status: "success", isDuplicate, error: undefined });
        succeeded++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        updateRow(row.clientId, { status: "error", error: message });
        failed++;
      }
    }

    setProgress(null);
    setSubmitting(false);

    if (succeeded > 0) {
      toast.success(`${succeeded} lançamento(s) salvo(s).`);
      router.refresh();
    }
    if (failed > 0) {
      toast.error(`${failed} linha(s) com erro. Corrija e envie novamente.`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <BulkAddRow
            key={row.clientId}
            row={row}
            people={people}
            categories={categories}
            creditCards={creditCards}
            onChange={(patch) => updateRow(row.clientId, patch)}
            onRemove={() => removeRow(row.clientId)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={addRow} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Adicionar linha
        </Button>

        <div className="flex items-center gap-3">
          {progress && (
            <span className="text-sm text-muted-foreground">
              Enviando {progress.current} de {progress.total}…
            </span>
          )}
          <Button type="button" onClick={handleSubmitAll} disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar tudo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
