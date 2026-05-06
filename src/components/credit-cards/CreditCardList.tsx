"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCardForm } from "./CreditCardForm";
import { ClosureManager } from "./ClosureManager";

type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  dueDayOfMonth: number;
  alwaysNextMonth: boolean;
};

type Props = { initialCards: CreditCard[] };

export function CreditCardList({ initialCards }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [expandedClosures, setExpandedClosures] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/credit-cards");
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      return;
    }
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm && !editingCard && (
        <Button onClick={() => setShowForm(true)} className="self-start">Add Credit Card</Button>
      )}
      {showForm && (
        <Card className="p-4">
          <CreditCardForm onSaved={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
        </Card>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {cards.length === 0 && <p className="text-sm text-muted-foreground">No credit cards yet.</p>}
      {cards.map((card) => (
        <Card key={card.id} className="p-4 flex flex-col gap-3">
          {editingCard?.id === card.id ? (
            <CreditCardForm card={card} onSaved={() => { setEditingCard(null); refresh(); }} onCancel={() => setEditingCard(null)} />
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{card.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {card.closureType === "FIXED" ? `Closes day ${card.fixedClosureDay}` : "Variable closure"} · Due day {card.dueDayOfMonth}
                    {card.alwaysNextMonth ? " · Always next month" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {card.closureType === "VARIABLE" && (
                    <Button variant="outline" size="sm" onClick={() => setExpandedClosures(expandedClosures === card.id ? null : card.id)}>
                      Closures
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditingCard(card)}>Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(card.id)}>Delete</Button>
                </div>
              </div>
              {expandedClosures === card.id && <ClosureManager cardId={card.id} />}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
