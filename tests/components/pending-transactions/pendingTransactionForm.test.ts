import {
  buildConfirmBody,
  canConfirm,
  initialPaymentChoice,
  type PendingItem,
  type ReviewCard,
  requiresBillingMonth,
} from "../../../src/components/pending-transactions/pendingTransactionForm";

const FIXED: ReviewCard = { id: "card-fixed", name: "Nubank", closureType: "FIXED" };
const VARIABLE: ReviewCard = { id: "card-var", name: "C6", closureType: "VARIABLE" };
const CARDS = [FIXED, VARIABLE];

const item = (overrides: Partial<PendingItem> = {}): PendingItem => ({
  id: "pending-1",
  amount: 12.5,
  occurredOn: "2026-11-16T00:00:00.000Z",
  merchant: "Padaria",
  cardName: "Nubank",
  creditCardId: null,
  suggestedCategoryId: null,
  ...overrides,
});

describe("initialPaymentChoice", () => {
  it("starts on the card the Wallet purchase was matched to", () => {
    expect(initialPaymentChoice(item({ creditCardId: "card-fixed" }))).toBe("card:card-fixed");
  });

  it("starts on debit when no registered card was matched", () => {
    expect(initialPaymentChoice(item())).toBe("DEBIT_CARD");
  });
});

describe("requiresBillingMonth", () => {
  it("is true only for a variable-closure card", () => {
    expect(requiresBillingMonth("card:card-var", CARDS)).toBe(true);
    expect(requiresBillingMonth("card:card-fixed", CARDS)).toBe(false);
    expect(requiresBillingMonth("PIX", CARDS)).toBe(false);
  });

  it("is false for a card that is not in the list", () => {
    expect(requiresBillingMonth("card:ghost", CARDS)).toBe(false);
  });
});

describe("canConfirm", () => {
  it("blocks a variable-closure card until a billing month is chosen", () => {
    expect(canConfirm("card:card-var", "", CARDS)).toBe(false);
    expect(canConfirm("card:card-var", "2026-12", CARDS)).toBe(true);
  });

  it("does not ask for a billing month otherwise", () => {
    expect(canConfirm("card:card-fixed", "", CARDS)).toBe(true);
    expect(canConfirm("DEBIT_CARD", "", CARDS)).toBe(true);
  });
});

describe("buildConfirmBody", () => {
  it("sends a payment method and no card for a non-credit purchase", () => {
    expect(
      buildConfirmBody({
        choice: "PIX",
        categoryId: "cat-1",
        billingMonth: "2026-12",
        cards: CARDS,
      }),
    ).toEqual({ categoryId: "cat-1", creditCardId: null, paymentMethod: "PIX" });
  });

  it("sends the card and leaves the billing month to the server for a fixed-closure card", () => {
    expect(
      buildConfirmBody({
        choice: "card:card-fixed",
        categoryId: "cat-1",
        billingMonth: "2026-12",
        cards: CARDS,
      }),
    ).toEqual({ categoryId: "cat-1", creditCardId: "card-fixed" });
  });

  it("sends the chosen billing month for a variable-closure card", () => {
    expect(
      buildConfirmBody({
        choice: "card:card-var",
        categoryId: "cat-1",
        billingMonth: "2026-12",
        cards: CARDS,
      }),
    ).toEqual({ categoryId: "cat-1", creditCardId: "card-var", billingMonth: "2026-12" });
  });

  it("sends null when no category was chosen", () => {
    expect(
      buildConfirmBody({ choice: "DEBIT_CARD", categoryId: "", billingMonth: "", cards: CARDS }),
    ).toEqual({ categoryId: null, creditCardId: null, paymentMethod: "DEBIT_CARD" });
  });
});
