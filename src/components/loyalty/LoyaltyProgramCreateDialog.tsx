"use client";

import { Dialog } from "@/components/ui/dialog";
import { LoyaltyProgramForm } from "./LoyaltyProgramForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function LoyaltyProgramCreateDialog({ open, onClose, onSuccess }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Novo Programa de Milhas">
      <LoyaltyProgramForm onSuccess={onSuccess} />
    </Dialog>
  );
}
