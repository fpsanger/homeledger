"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingTransactionCard } from "./PendingTransactionCard";
import type { PendingItem, ReviewCard } from "./pendingTransactionForm";

type Category = { id: string; name: string; parentId: string | null };

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(url);
  return response.json();
}

export function PendingTransactionsReview() {
  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchJson("/api/pending-transactions"),
      fetchJson("/api/credit-cards"),
      fetchJson("/api/categories"),
    ])
      .then(([pending, creditCards, categoryList]) => {
        setItems(pending.pending ?? []);
        setCards(creditCards.cards ?? []);
        setCategories(categoryList.categories ?? []);
      })
      .catch(() => setFailed(true));
  }, []);

  function handleResolved(id: string) {
    setItems((current) => current?.filter((item) => item.id !== id) ?? current);
  }

  if (failed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar as compras para revisar. Recarregue a página.
      </p>
    );
  }

  if (items === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">Nada para revisar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          As compras feitas com o Apple Pay aparecem aqui assim que o Atalho as envia.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <PendingTransactionCard
            item={item}
            cards={cards}
            categories={categories}
            onResolved={handleResolved}
          />
        </li>
      ))}
    </ul>
  );
}
