import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { CardSections } from "../../credit-cards/bulk-add/useCardSections";
import { cardJobs, normalJobs, type Outcome, runJobs } from "./submitAll";
import type { NormalRows } from "./useNormalRows";

type Progress = { current: number; total: number };

/** Sends every pending row of both sections, one request each, and reports the outcome once. */
export function useBulkSubmit(normal: NormalRows, cards: CardSections) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function submitAll() {
    if (submitting) return;

    const jobs = [
      ...normalJobs(normal.rows, normal.updateRow),
      ...cardJobs(cards.sections, cards.updateRow),
    ];
    if (jobs.length === 0) {
      toast.error("Nada para enviar.");
      return;
    }

    setSubmitting(true);
    const outcome = await runJobs(jobs, setProgress);
    setProgress(null);
    setSubmitting(false);
    reportOutcome(outcome, router);
  }

  return { submitting, progress, submitAll };
}

function reportOutcome(
  { succeeded, failed }: Outcome,
  router: { push: (href: string) => void; refresh: () => void },
) {
  if (succeeded > 0) toast.success(`${succeeded} lançamento(s) salvo(s).`);
  if (failed > 0) {
    toast.error(`${failed} linha(s) com erro. Corrija e envie novamente.`);
    if (succeeded > 0) router.refresh();
    return;
  }
  if (succeeded > 0) {
    // The router cache can still hold the list from before the save; drop it so the new entries show.
    router.push("/transactions");
    router.refresh();
  }
}
