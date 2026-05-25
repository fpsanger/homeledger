"use client";

import { Dialog } from "@/components/ui/dialog";
import { LoyaltyTransferForm } from "./LoyaltyTransferForm";

type Program = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programs: Program[];
};

export function LoyaltyTransferDialog({ open, onClose, onSuccess, programs }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Nova Transferência">
      <LoyaltyTransferForm programs={programs} onSuccess={onSuccess} />
    </Dialog>
  );
}
