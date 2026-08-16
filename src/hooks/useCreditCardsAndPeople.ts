import { useEffect, useState } from "react";

type NamedRecord = { id: string; name: string };

export function useCreditCardsAndPeople() {
  const [creditCards, setCreditCards] = useState<NamedRecord[]>([]);
  const [people, setPeople] = useState<NamedRecord[]>([]);

  useEffect(() => {
    fetch("/api/credit-cards")
      .then((r) => r.json())
      .then((d) => setCreditCards(d.cards ?? []))
      .catch(() => setCreditCards([]));
    fetch("/api/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people ?? []))
      .catch(() => setPeople([]));
  }, []);

  return { creditCards, people };
}
