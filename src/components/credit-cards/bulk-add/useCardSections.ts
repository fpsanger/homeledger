import { useReducer } from "react";
import {
  type ClosureType,
  createEmptyRow,
  defaultSectionBillingMonth,
  duplicateRow,
  type PurchaseRow,
} from "./types";

export type BulkCreditCard = { id: string; name: string; closureType: ClosureType };

export type CardSectionState = {
  cardId: string;
  personId: string;
  billingMonth: string;
  rows: PurchaseRow[];
};

export type CardSectionsState = { sections: CardSectionState[]; pendingCardId: string };

type Action =
  | { type: "SET_PENDING_CARD"; cardId: string }
  | { type: "ADD_SECTION"; card: BulkCreditCard; personId: string; today: string }
  | { type: "REMOVE_SECTION"; cardId: string }
  | { type: "SET_PERSON"; cardId: string; personId: string }
  | { type: "SET_BILLING_MONTH"; cardId: string; billingMonth: string }
  | { type: "ADD_ROW"; cardId: string; today: string }
  | { type: "REMOVE_ROW"; cardId: string; rowId: string }
  | { type: "DUPLICATE_ROW"; cardId: string; rowId: string; today: string }
  | { type: "UPDATE_ROW"; cardId: string; rowId: string; patch: Partial<PurchaseRow> };

type Handlers = {
  [K in Action["type"]]: (
    state: CardSectionsState,
    action: Extract<Action, { type: K }>,
  ) => CardSectionsState;
};

function mapSection(
  state: CardSectionsState,
  cardId: string,
  update: (section: CardSectionState) => CardSectionState,
): CardSectionsState {
  return {
    ...state,
    sections: state.sections.map((s) => (s.cardId === cardId ? update(s) : s)),
  };
}

function mapRows(
  state: CardSectionsState,
  cardId: string,
  update: (rows: PurchaseRow[]) => PurchaseRow[],
): CardSectionsState {
  return mapSection(state, cardId, (s) => ({ ...s, rows: update(s.rows) }));
}

function clearRowError(row: PurchaseRow): PurchaseRow {
  return row.status === "error" ? { ...row, status: "pending", error: undefined } : row;
}

function withCopyAfter(rows: PurchaseRow[], rowId: string, today: string): PurchaseRow[] {
  const index = rows.findIndex((r) => r.rowId === rowId);
  if (index === -1) return rows;
  return [...rows.slice(0, index + 1), duplicateRow(rows[index], today), ...rows.slice(index + 1)];
}

const handlers: Handlers = {
  SET_PENDING_CARD: (state, { cardId }) => ({ ...state, pendingCardId: cardId }),
  ADD_SECTION: (state, { card, personId, today }) => ({
    pendingCardId: "",
    sections: [
      ...state.sections,
      {
        cardId: card.id,
        personId,
        billingMonth: defaultSectionBillingMonth(card.closureType, today),
        rows: [createEmptyRow(today)],
      },
    ],
  }),
  REMOVE_SECTION: (state, { cardId }) => ({
    ...state,
    sections: state.sections.filter((s) => s.cardId !== cardId),
  }),
  SET_PERSON: (state, { cardId, personId }) =>
    mapSection(state, cardId, (s) => ({ ...s, personId, rows: s.rows.map(clearRowError) })),
  SET_BILLING_MONTH: (state, { cardId, billingMonth }) =>
    mapSection(state, cardId, (s) => ({ ...s, billingMonth, rows: s.rows.map(clearRowError) })),
  ADD_ROW: (state, { cardId, today }) =>
    mapRows(state, cardId, (rows) => [...rows, createEmptyRow(today)]),
  REMOVE_ROW: (state, { cardId, rowId }) =>
    mapRows(state, cardId, (rows) => rows.filter((r) => r.rowId !== rowId)),
  DUPLICATE_ROW: (state, { cardId, rowId, today }) =>
    mapRows(state, cardId, (rows) => withCopyAfter(rows, rowId, today)),
  UPDATE_ROW: (state, { cardId, rowId, patch }) =>
    mapRows(state, cardId, (rows) => rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))),
};

export function cardSectionsReducer(state: CardSectionsState, action: Action): CardSectionsState {
  const handle = handlers[action.type] as (
    state: CardSectionsState,
    action: Action,
  ) => CardSectionsState;
  return handle(state, action);
}

const EDITED: Partial<PurchaseRow> = {
  status: "pending",
  error: undefined,
  isDuplicate: undefined,
};

export function useCardSections(
  creditCards: BulkCreditCard[],
  defaultPersonId: string,
  today: string,
) {
  const [state, dispatch] = useReducer(cardSectionsReducer, { sections: [], pendingCardId: "" });
  const availableCards = creditCards.filter((c) => !state.sections.some((s) => s.cardId === c.id));

  return {
    sections: state.sections,
    pendingCardId: state.pendingCardId,
    availableCards,
    setPendingCardId: (cardId: string) => dispatch({ type: "SET_PENDING_CARD", cardId }),
    addSection: () => {
      const card = creditCards.find((c) => c.id === state.pendingCardId);
      if (card) dispatch({ type: "ADD_SECTION", card, personId: defaultPersonId, today });
    },
    removeSection: (cardId: string) => dispatch({ type: "REMOVE_SECTION", cardId }),
    setPerson: (cardId: string, personId: string) =>
      dispatch({ type: "SET_PERSON", cardId, personId }),
    setBillingMonth: (cardId: string, billingMonth: string) =>
      dispatch({ type: "SET_BILLING_MONTH", cardId, billingMonth }),
    addRow: (cardId: string) => dispatch({ type: "ADD_ROW", cardId, today }),
    removeRow: (cardId: string, rowId: string) => dispatch({ type: "REMOVE_ROW", cardId, rowId }),
    duplicateRow: (cardId: string, rowId: string) =>
      dispatch({ type: "DUPLICATE_ROW", cardId, rowId, today }),
    updateRow: (cardId: string, rowId: string, patch: Partial<PurchaseRow>) =>
      dispatch({ type: "UPDATE_ROW", cardId, rowId, patch }),
    editRow: (cardId: string, rowId: string, patch: Partial<PurchaseRow>) =>
      dispatch({ type: "UPDATE_ROW", cardId, rowId, patch: { ...patch, ...EDITED } }),
  };
}

export type CardSections = ReturnType<typeof useCardSections>;
