import { CreditCardList } from "@/components/credit-cards/CreditCardList";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getCards() {
  const res = await fetch(`${BASE_URL}/api/credit-cards`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.cards;
}

export default async function CreditCardsPage() {
  const cards = await getCards();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Credit Cards</h1>
      <CreditCardList initialCards={cards} />
    </div>
  );
}
