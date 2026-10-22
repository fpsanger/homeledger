"use client";

import { Button } from "@/components/ui/button";
import { CardCombobox } from "../../credit-cards/bulk-add/CardCombobox";
import { CardSection } from "../../credit-cards/bulk-add/CardSection";
import type { BulkCreditCard, CardSections } from "../../credit-cards/bulk-add/useCardSections";
import type { Category, Person } from "../types";
import { SectionHeader } from "./SectionHeader";
import type { Totals } from "./summary";

type Props = {
  cards: CardSections;
  creditCards: BulkCreditCard[];
  people: Person[];
  categories: Category[];
  totals: Totals;
  disabled: boolean;
};

/** Purchases on several cards at once, each card in its own block, à vista or in installments. */
export function CardsSection({ cards, creditCards, people, categories, totals, disabled }: Props) {
  return (
    <section aria-labelledby="bulk-cards-title" className="flex flex-col gap-3">
      <SectionHeader
        id="bulk-cards-title"
        title="Compras no cartão"
        description="À vista ou parceladas, em um ou mais cartões."
        totals={totals}
      />

      <div className="flex items-center gap-2">
        <div className="max-w-xs flex-1">
          <CardCombobox
            cards={cards.availableCards}
            value={cards.pendingCardId}
            onChange={cards.setPendingCardId}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={cards.addSection}
          disabled={disabled || !cards.pendingCardId}
        >
          Adicionar cartão
        </Button>
      </div>

      {cards.sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Escolha um cartão para lançar compras à vista ou parceladas. Você pode adicionar quantos
          cartões precisar.
        </p>
      )}

      {cards.sections.map((section) => {
        const card = creditCards.find((c) => c.id === section.cardId);
        if (!card) return null;
        return (
          <CardSection
            key={section.cardId}
            card={card}
            rows={section.rows}
            billingMonth={section.billingMonth}
            onBillingMonthChange={(value) => cards.setBillingMonth(section.cardId, value)}
            categories={categories}
            people={people}
            personId={section.personId}
            onPersonChange={(id) => cards.setPerson(section.cardId, id)}
            onAddRow={() => cards.addRow(section.cardId)}
            onEditRow={(rowId, patch) => cards.editRow(section.cardId, rowId, patch)}
            onRemoveRow={(rowId) => cards.removeRow(section.cardId, rowId)}
            onDuplicateRow={(rowId) => cards.duplicateRow(section.cardId, rowId)}
            onRemoveSection={() => cards.removeSection(section.cardId)}
            disabled={disabled}
          />
        );
      })}
    </section>
  );
}
