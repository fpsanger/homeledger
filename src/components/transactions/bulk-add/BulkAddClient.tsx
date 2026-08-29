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

  function editRow(clientId: string, patch: Partial<BulkRow>) {
    if (submitting) return;
    updateRow(clientId, {
      ...patch,
      status: "pending",
      error: undefined,
      isDuplicate: undefined,
    });
  }

  function addRow() {
    if (submitting) return;
    setRows((prev) => [...prev, createEmptyRow(defaultPersonId, today)]);
  }

  function removeRow(clientId: string) {
    if (submitting) return;
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

    reportSubmission(succeeded, failed, router.refresh);
  }

  return (
    <div className="flex flex-col gap-4">
      <BulkAddRows
        rows={rows}
        people={people}
        categories={categories}
        creditCards={creditCards}
        disabled={submitting}
        onChange={editRow}
        onRemove={removeRow}
      />
      <BulkAddActions
        progress={progress}
        submitting={submitting}
        onAdd={addRow}
        onSubmit={handleSubmitAll}
      />
    </div>
  );
}

function reportSubmission(succeeded: number, failed: number, refresh: () => void) {
  if (succeeded > 0) {
    toast.success(`${succeeded} lançamento(s) salvo(s).`);
    refresh();
  }
  if (failed > 0) toast.error(`${failed} linha(s) com erro. Corrija e envie novamente.`);
}

type BulkAddRowsProps = Pick<Props, "people" | "categories" | "creditCards"> & {
  rows: BulkRow[];
  disabled: boolean;
  onChange: (clientId: string, patch: Partial<BulkRow>) => void;
  onRemove: (clientId: string) => void;
};

function BulkAddRows({ rows, disabled, onChange, onRemove, ...options }: BulkAddRowsProps) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <BulkAddRow
          key={row.clientId}
          row={row}
          {...options}
          onChange={(patch) => onChange(row.clientId, patch)}
          onRemove={() => onRemove(row.clientId)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

type BulkAddActionsProps = {
  progress: { current: number; total: number } | null;
  submitting: boolean;
  onAdd: () => void;
  onSubmit: () => void;
};

function BulkAddActions({ progress, submitting, onAdd, onSubmit }: BulkAddActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="gap-1.5"
        disabled={submitting}
      >
        <Plus className="w-4 h-4" />
        Adicionar linha
      </Button>

      <div className="flex items-center gap-3">
        {progress && (
          <span className="text-sm text-muted-foreground">
            Enviando {progress.current} de {progress.total}…
          </span>
        )}
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar tudo"}
        </Button>
      </div>
    </div>
  );
}
