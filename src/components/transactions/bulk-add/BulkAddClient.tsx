"use client";

import type { BulkCreditCard } from "../../credit-cards/bulk-add/useCardSections";
import { useCardSections } from "../../credit-cards/bulk-add/useCardSections";
import type { Category, Person } from "../types";
import { BulkFooter, combineTotals } from "./BulkFooter";
import { CardsSection } from "./CardsSection";
import { NormalSection } from "./NormalSection";
import { summarizeCards, summarizeNormal } from "./summary";
import { useBulkSubmit } from "./useBulkSubmit";
import { useNormalRows } from "./useNormalRows";

type Props = {
  people: Person[];
  categories: Category[];
  creditCards: BulkCreditCard[];
  defaultPersonId?: string;
};

/** One page for everything entered in a sitting: normal entries and multi-card purchases. */
export function BulkAddClient({ people, categories, creditCards, defaultPersonId = "" }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const normal = useNormalRows(defaultPersonId, today);
  const cards = useCardSections(creditCards, defaultPersonId, today);
  const { submitting, progress, submitAll } = useBulkSubmit(normal, cards, creditCards);

  const normalTotals = summarizeNormal(normal.rows);
  const cardTotals = summarizeCards(cards.sections);
  const { count, spendingCents } = combineTotals(normalTotals, cardTotals);

  return (
    <div className="flex flex-col gap-10">
      <NormalSection
        normal={normal}
        people={people}
        categories={categories}
        totals={normalTotals}
        disabled={submitting}
      />
      <CardsSection
        cards={cards}
        creditCards={creditCards}
        people={people}
        categories={categories}
        totals={cardTotals}
        disabled={submitting}
      />
      <BulkFooter
        count={count}
        spendingCents={spendingCents}
        progress={progress}
        submitting={submitting}
        onSubmit={submitAll}
      />
    </div>
  );
}
