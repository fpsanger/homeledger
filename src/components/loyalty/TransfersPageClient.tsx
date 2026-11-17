"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyTransferDialog } from "./LoyaltyTransferDialog";
import { LoyaltyTransferTable } from "./LoyaltyTransferTable";

type Program = { id: string; name: string; type: string };

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

type Props = {
  transfers: Transfer[];
  programs: Program[];
};

export function TransfersPageClient({ transfers, programs }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Milhas"
        title="Transferências"
        description={
          transfers.length > 0 ? `${transfers.length} transferências registradas` : undefined
        }
      >
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2"
        >
          + Transferências entre parceiros
        </Button>
      </PageHeader>

      <LoyaltyTransferDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        programs={programs}
      />

      <LoyaltyTransferTable transfers={transfers} programs={programs} />
    </div>
  );
}
