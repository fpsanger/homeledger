import type { CreditCardRecord } from "../entities/CreditCard";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsWords(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `);
}

/**
 * Finds the registered card a Wallet card name refers to. Returns null when the name is blank or
 * when zero or several cards fit, so the user picks the card instead of the app guessing.
 */
export function matchCreditCard(
  walletName: string,
  cards: CreditCardRecord[],
): CreditCardRecord | null {
  const wanted = normalizeName(walletName);
  if (!wanted) return null;

  const named = cards.map((card) => ({ card, name: normalizeName(card.name) }));
  const exact = named.filter((entry) => entry.name === wanted);
  if (exact.length === 1) return exact[0].card;
  if (exact.length > 1) return null;

  const related = named.filter(
    (entry) =>
      entry.name !== "" && (containsWords(wanted, entry.name) || containsWords(entry.name, wanted)),
  );
  return related.length === 1 ? related[0].card : null;
}
