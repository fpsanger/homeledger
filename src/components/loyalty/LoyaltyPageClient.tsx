"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoyaltyProgramList } from "./LoyaltyProgramList";
import { LoyaltyProgramCreateDialog } from "./LoyaltyProgramCreateDialog";
import { PageHeader } from "@/components/ui/page-header";

type Program = {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export function LoyaltyPageClient({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Finanças"
        title="Programas de Milhas"
        description={programs.length > 0 ? `${programs.length} programas cadastrados` : undefined}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Adicionar Programa
        </button>
      </PageHeader>

      <LoyaltyProgramCreateDialog open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} />
      <LoyaltyProgramList programs={programs} />
    </div>
  );
}
