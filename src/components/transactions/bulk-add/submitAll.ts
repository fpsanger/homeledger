import { submitPurchase } from "../../credit-cards/bulk-add/submitPurchase";
import {
  resolveRowBillingMonth,
  validateBillingMonth,
  validatePersonId,
  validateRow as validatePurchaseRow,
} from "../../credit-cards/bulk-add/types";
import type { CardSectionState } from "../../credit-cards/bulk-add/useCardSections";
import { submitRow } from "./submitRow";
import { pendingCardRows, pendingNormalRows } from "./summary";
import { type BulkRow, validateRow } from "./types";

export type RowPatch = {
  status: "loading" | "success" | "error";
  error?: string;
  isDuplicate?: boolean;
};

export type SubmitJob = {
  validationError: string | null;
  send: () => Promise<{ isDuplicate: boolean }>;
  update: (patch: RowPatch) => void;
};

export type Outcome = { succeeded: number; failed: number };

export function normalJobs(
  rows: BulkRow[],
  update: (clientId: string, patch: RowPatch) => void,
): SubmitJob[] {
  return pendingNormalRows(rows).map((row) => ({
    validationError: validateRow(row),
    send: () => submitRow(row),
    update: (patch) => update(row.clientId, patch),
  }));
}

export function cardJobs(
  sections: CardSectionState[],
  update: (cardId: string, rowId: string, patch: RowPatch) => void,
): SubmitJob[] {
  return sections.flatMap((section) => {
    const personError = validatePersonId(section.personId);
    return pendingCardRows(section).map((row) => {
      const billingMonth = resolveRowBillingMonth(row, section.billingMonth);
      return {
        validationError:
          personError ?? validatePurchaseRow(row) ?? validateBillingMonth(billingMonth),
        send: () => submitPurchase(section.personId, row, section.cardId, billingMonth),
        update: (patch) => update(section.cardId, row.rowId, patch),
      };
    });
  });
}

async function runJob(job: SubmitJob): Promise<boolean> {
  if (job.validationError) {
    job.update({ status: "error", error: job.validationError });
    return false;
  }
  job.update({ status: "loading" });
  try {
    const { isDuplicate } = await job.send();
    job.update({ status: "success", isDuplicate });
    return true;
  } catch (err) {
    job.update({
      status: "error",
      error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    return false;
  }
}

/** One request per row, in order: a failed row is flagged and the rest still go through. */
export async function runJobs(
  jobs: SubmitJob[],
  onProgress: (progress: { current: number; total: number }) => void,
): Promise<Outcome> {
  const outcome: Outcome = { succeeded: 0, failed: 0 };
  for (let i = 0; i < jobs.length; i++) {
    onProgress({ current: i + 1, total: jobs.length });
    if (await runJob(jobs[i])) outcome.succeeded += 1;
    else outcome.failed += 1;
  }
  return outcome;
}
