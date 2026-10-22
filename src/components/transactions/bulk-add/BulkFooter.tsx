import { Button } from "@/components/ui/button";
import { formatBRL } from "../../credit-cards/bulk-add/installmentNote";
import type { Totals } from "./summary";

type Props = {
  count: number;
  spendingCents: number;
  progress: { current: number; total: number } | null;
  submitting: boolean;
  onSubmit: () => void;
};

/** Always in reach: how much is waiting to be sent, and the single send button. */
export function BulkFooter({ count, spendingCents, progress, submitting, onSubmit }: Props) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border bg-background py-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {progress ? (
          `Enviando ${progress.current} de ${progress.total}…`
        ) : (
          <Summary count={count} spendingCents={spendingCents} />
        )}
      </p>
      <Button type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Enviando…" : "Enviar tudo"}
      </Button>
    </div>
  );
}

function Summary({ count, spendingCents }: { count: number; spendingCents: number }) {
  if (count === 0) return <>Nada para enviar ainda.</>;
  return (
    <>
      {count} {count === 1 ? "lançamento" : "lançamentos"} para enviar
      {spendingCents > 0 && (
        <>
          {" · gastos "}
          <span className="font-semibold tracking-tight tabular-nums text-foreground">
            −{formatBRL(spendingCents)}
          </span>
        </>
      )}
    </>
  );
}

export function combineTotals(...parts: Totals[]): { count: number; spendingCents: number } {
  return {
    count: parts.reduce((sum, p) => sum + p.count, 0),
    spendingCents: parts.reduce((sum, p) => sum + p.expenseCents, 0),
  };
}
