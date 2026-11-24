"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoyaltyProgramEditDialog } from "./LoyaltyProgramEditDialog";
import type { EditableProgram } from "./LoyaltyProgramForm";
import { LoyaltyPurchaseSimulator, type SimulatorSummary } from "./LoyaltyPurchaseSimulator";
import { formatReferenceRange } from "./loyaltyFormat";

type Props = {
  program: EditableProgram;
  summary: SimulatorSummary;
};

const BUTTON_CLASS =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-muted transition-colors";

export function LoyaltyProgramToolbar({ program, summary }: Props) {
  const router = useRouter();
  const [simulating, setSimulating] = useState(false);
  const [editing, setEditing] = useState(false);
  const reference = formatReferenceRange(
    program.referenceMinPer1kBrl,
    program.referenceMaxPer1kBrl,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setSimulating(true)} className={BUTTON_CLASS}>
        Simular compra
      </button>
      <button type="button" onClick={() => setEditing(true)} className={BUTTON_CLASS}>
        Editar programa
      </button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {reference ? `Referência do milheiro: ${reference}` : "Referência do milheiro não definida"}
      </span>

      <LoyaltyPurchaseSimulator
        open={simulating}
        program={program}
        summary={summary}
        onClose={() => setSimulating(false)}
      />
      <LoyaltyProgramEditDialog
        open={editing}
        program={program}
        onClose={() => setEditing(false)}
        onSuccess={() => {
          setEditing(false);
          router.refresh();
          toast.success("Programa atualizado.");
        }}
      />
    </div>
  );
}
