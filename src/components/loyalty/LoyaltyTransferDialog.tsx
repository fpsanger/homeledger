"use client";

import { Dialog } from "@/components/ui/dialog";
import { LoyaltyTransferForm } from "./LoyaltyTransferForm";

type Program = { id: string; name: string; type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programs: Program[];
  personId?: string;
};

export function LoyaltyTransferDialog({ open, onClose, onSuccess, programs, personId }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Nova Transferência">
      <LoyaltyTransferForm programs={programs} onSuccess={onSuccess} personId={personId} />
    </Dialog>
  );
}
