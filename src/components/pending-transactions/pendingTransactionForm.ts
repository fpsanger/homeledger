export type ReviewCard = { id: string; name: string; closureType: "FIXED" | "VARIABLE" };

export type PendingItem = {
  id: string;
  amount: number;
  occurredOn: string;
  merchant: string;
  cardName: string;
  creditCardId: string | null;
  suggestedCategoryId: string | null;
};

export type ConfirmBody = {
  categoryId: string | null;
  creditCardId: string | null;
  billingMonth?: string;
  paymentMethod?: string;
};

const CARD_PREFIX = "card:";
const DEFAULT_PAYMENT_METHOD = "DEBIT_CARD";

/** Payment choices that are not a registered credit card. */
export const NON_CREDIT_OPTIONS = [
  { value: "DEBIT_CARD", label: "Débito" },
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
] as const;

export function cardChoice(cardId: string): string {
  return `${CARD_PREFIX}${cardId}`;
}

function cardIdOf(choice: string): string | null {
  return choice.startsWith(CARD_PREFIX) ? choice.slice(CARD_PREFIX.length) : null;
}

export function initialPaymentChoice(item: PendingItem): string {
  return item.creditCardId ? cardChoice(item.creditCardId) : DEFAULT_PAYMENT_METHOD;
}

export function requiresBillingMonth(choice: string, cards: ReviewCard[]): boolean {
  const cardId = cardIdOf(choice);
  return cards.some((card) => card.id === cardId && card.closureType === "VARIABLE");
}

export function canConfirm(choice: string, billingMonth: string, cards: ReviewCard[]): boolean {
  return !requiresBillingMonth(choice, cards) || billingMonth !== "";
}

export function buildConfirmBody(input: {
  choice: string;
  categoryId: string;
  billingMonth: string;
  cards: ReviewCard[];
}): ConfirmBody {
  const categoryId = input.categoryId || null;
  const cardId = cardIdOf(input.choice);
  if (cardId === null) {
    return { categoryId, creditCardId: null, paymentMethod: input.choice };
  }
  const body: ConfirmBody = { categoryId, creditCardId: cardId };
  if (requiresBillingMonth(input.choice, input.cards)) body.billingMonth = input.billingMonth;
  return body;
}
