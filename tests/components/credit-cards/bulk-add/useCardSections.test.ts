import { createEmptyRow, type PurchaseRow } from "@/components/credit-cards/bulk-add/types";
import {
  type BulkCreditCard,
  type CardSectionsState,
  cardSectionsReducer,
} from "@/components/credit-cards/bulk-add/useCardSections";

const fixed: BulkCreditCard = { id: "card-1", name: "Nubank", closureType: "FIXED" };
const variable: BulkCreditCard = { id: "card-2", name: "Itaú", closureType: "VARIABLE" };

const empty: CardSectionsState = { sections: [], pendingCardId: "" };

function withSection(card: BulkCreditCard, state = empty): CardSectionsState {
  return cardSectionsReducer(state, {
    type: "ADD_SECTION",
    card,
    personId: "person-1",
    today: "2026-08-17",
  });
}

function onlyRow(state: CardSectionsState, cardId = fixed.id): PurchaseRow {
  return state.sections.find((s) => s.cardId === cardId)?.rows[0] as PurchaseRow;
}

describe("cardSectionsReducer", () => {
  it("adds a section with one empty row, the default person and a bill by closure type", () => {
    const state = withSection(variable, withSection(fixed));

    expect(state.sections.map((s) => [s.cardId, s.personId, s.billingMonth])).toEqual([
      ["card-1", "person-1", ""],
      ["card-2", "person-1", ""],
    ]);
    expect(state.sections[0].rows).toHaveLength(1);
    expect(state.pendingCardId).toBe("");
  });

  it("gives each section its own person", () => {
    const state = cardSectionsReducer(withSection(variable, withSection(fixed)), {
      type: "SET_PERSON",
      cardId: "card-2",
      personId: "person-2",
    });

    expect(state.sections.map((s) => s.personId)).toEqual(["person-1", "person-2"]);
  });

  it("clears row errors when the person or the bill changes", () => {
    let state = withSection(fixed);
    const rowId = onlyRow(state).rowId;
    state = cardSectionsReducer(state, {
      type: "UPDATE_ROW",
      cardId: "card-1",
      rowId,
      patch: { status: "error", error: "Selecione a pessoa." },
    });

    state = cardSectionsReducer(state, { type: "SET_PERSON", cardId: "card-1", personId: "p2" });
    expect(onlyRow(state)).toMatchObject({ status: "pending", error: undefined });

    state = cardSectionsReducer(state, {
      type: "UPDATE_ROW",
      cardId: "card-1",
      rowId,
      patch: { status: "error", error: "Fatura inválida." },
    });
    state = cardSectionsReducer(state, {
      type: "SET_BILLING_MONTH",
      cardId: "card-1",
      billingMonth: "2026-10",
    });
    expect(onlyRow(state)).toMatchObject({ status: "pending", error: undefined });
  });

  it("adds, copies after the source, updates and removes rows", () => {
    let state = withSection(fixed);
    const first = onlyRow(state).rowId;
    state = cardSectionsReducer(state, { type: "ADD_ROW", cardId: "card-1", today: "2026-08-17" });
    expect(state.sections[0].rows).toHaveLength(2);

    state = cardSectionsReducer(state, {
      type: "UPDATE_ROW",
      cardId: "card-1",
      rowId: first,
      patch: { description: "Mercado", numberOfInstallments: "6" },
    });
    state = cardSectionsReducer(state, {
      type: "DUPLICATE_ROW",
      cardId: "card-1",
      rowId: first,
      today: "2026-08-20",
    });
    const rows = state.sections[0].rows;
    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ description: "Mercado", numberOfInstallments: "6" });
    expect(rows[1].rowId).not.toBe(first);

    state = cardSectionsReducer(state, {
      type: "REMOVE_ROW",
      cardId: "card-1",
      rowId: first,
    });
    expect(state.sections[0].rows).toHaveLength(2);
  });

  it("ignores a copy of a row that no longer exists", () => {
    const state = withSection(fixed);
    const next = cardSectionsReducer(state, {
      type: "DUPLICATE_ROW",
      cardId: "card-1",
      rowId: "missing",
      today: "2026-08-17",
    });

    expect(next.sections[0].rows).toHaveLength(1);
  });

  it("removes a section and remembers the pending card", () => {
    let state = cardSectionsReducer(withSection(fixed), { type: "SET_PENDING_CARD", cardId: "x" });
    expect(state.pendingCardId).toBe("x");

    state = cardSectionsReducer(state, { type: "REMOVE_SECTION", cardId: "card-1" });
    expect(state.sections).toHaveLength(0);
  });

  it("keeps rows of other sections untouched", () => {
    const state = withSection(variable, withSection(fixed));
    const before = createEmptyRow("2026-08-17");
    const next = cardSectionsReducer(state, {
      type: "UPDATE_ROW",
      cardId: "card-1",
      rowId: onlyRow(state).rowId,
      patch: { description: "x" },
    });

    expect(onlyRow(next, "card-2")).toEqual(onlyRow(state, "card-2"));
    expect(before.description).toBe("");
  });
});
