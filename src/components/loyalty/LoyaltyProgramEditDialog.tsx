"use client";

import { Dialog } from "@/components/ui/dialog";
import { type EditableProgram, LoyaltyProgramForm } from "./LoyaltyProgramForm";

type Props = {
  open: boolean;
  program: EditableProgram;
  onClose: () => void;
  onSuccess: () => void;
};

export function LoyaltyProgramEditDialog({ open, program, onClose, onSuccess }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Editar programa">
      <LoyaltyProgramForm program={program} onSuccess={onSuccess} />
    </Dialog>
  );
}
