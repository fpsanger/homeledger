"use client";

import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EditRecurringBody } from "./editRecurring/EditRecurringBody";
import { toMonthValue } from "./editRecurring/recurringMonths";
import { useRecurringRule } from "./editRecurring/useRecurringRule";
import type { Category, Person, Transaction } from "./types";

function LoadingBody() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function EditRecurringDialog({
  transaction,
  people,
  categories,
  onClose,
}: {
  transaction: Transaction | null;
  people: Person[];
  categories: Category[];
  onClose: () => void;
}) {
  const { rule, draft, patchDraft, step, setStep } = useRecurringRule({
    transactionId: transaction?.id ?? null,
    viewedMonth: transaction ? toMonthValue(transaction.date) : null,
    onClose,
  });

  return (
    <Dialog
      open={transaction !== null}
      onClose={onClose}
      title={step === "edit" ? "Editar recorrência" : "Confirmar alteração"}
    >
      {rule && draft ? (
        <EditRecurringBody
          rule={rule}
          draft={draft}
          patchDraft={patchDraft}
          step={step}
          setStep={setStep}
          people={people}
          categories={categories}
          onClose={onClose}
        />
      ) : (
        <LoadingBody />
      )}
    </Dialog>
  );
}
