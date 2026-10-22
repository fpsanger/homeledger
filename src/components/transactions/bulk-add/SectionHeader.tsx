import { formatBRL } from "../../credit-cards/bulk-add/installmentNote";
import type { Totals } from "./summary";

type Props = {
  id: string;
  title: string;
  description: string;
  totals: Totals;
};

/** Section title with what is still to be sent. Signs carry the meaning; color only echoes it. */
export function SectionHeader({ id, title, description, totals }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <SectionTotals totals={totals} />
    </div>
  );
}

function SectionTotals({ totals }: { totals: Totals }) {
  if (totals.expenseCents === 0 && totals.incomeCents === 0) return null;

  return (
    <p className="flex gap-4 text-base font-semibold tracking-tight tabular-nums">
      {totals.expenseCents > 0 && (
        <span className="amount-negative">
          <span className="sr-only">Despesas </span>−{formatBRL(totals.expenseCents)}
        </span>
      )}
      {totals.incomeCents > 0 && (
        <span className="amount-positive">
          <span className="sr-only">Receitas </span>+{formatBRL(totals.incomeCents)}
        </span>
      )}
    </p>
  );
}
