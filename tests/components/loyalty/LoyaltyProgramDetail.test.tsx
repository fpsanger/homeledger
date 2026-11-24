/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { LoyaltyProgramDetail } from "@/components/loyalty/LoyaltyProgramDetail";
import type { Transaction } from "@/components/loyalty/loyaltyFormat";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("@/components/loyalty/AddTransactionModal", () => ({ AddTransactionModal: () => null }));
jest.mock("@/components/loyalty/EditTransactionModal", () => ({
  EditTransactionModal: ({ tx }: { tx: Transaction }) => (
    <div data-testid="edit-modal" data-tx-id={tx.id} />
  ),
}));

const program = { id: "p1", name: "Smiles", type: "AIRLINE", color: "#f60" };

const summary = {
  currentBalance: 1000,
  totalInvested: 100,
  avgCostPer1kPoints: 25,
  totalValueRedeemed: 0,
  totalExpired: 0,
  overallRoi: null,
};

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    type: "PURCHASE",
    points: 4000,
    date: "2026-03-10T12:00:00.000Z",
    description: null,
    expiresAt: null,
    costBrl: null,
    valueBrl: null,
    transferId: null,
    personId: null,
    ...overrides,
  };
}

const transactions: Transaction[] = [
  tx({
    id: "t-old",
    type: "PURCHASE",
    points: 4000,
    costBrl: 100,
    date: "2026-01-05T12:00:00.000Z",
    description: "Compra antiga",
    expiresAt: "2027-01-05T12:00:00.000Z",
  }),
  tx({
    id: "t-new",
    type: "REDEEM",
    points: 2000,
    date: "2026-03-10T12:00:00.000Z",
    description: "Resgate recente",
    fifoData: { costBrl: 50, costPer1kPoints: 25, roi: 12.5 },
  }),
];

function renderDetail(list: Transaction[] = transactions) {
  render(<LoyaltyProgramDetail program={program} report={{ summary, transactions: list }} />);
  return screen.getByTestId("loyalty-transaction-cards");
}

describe("LoyaltyProgramDetail mobile transaction list", () => {
  it("renders one card per transaction with type, points and description", () => {
    const cards = renderDetail();

    expect(within(cards).getByText(/Compra antiga/)).toBeInTheDocument();
    expect(within(cards).getByText("Resgate recente")).toBeInTheDocument();
    expect(within(cards).getByText("Compra")).toBeInTheDocument();
    expect(within(cards).getByText("Resgate")).toBeInTheDocument();
    expect(within(cards).getByText("+4.000")).toBeInTheDocument();
    expect(within(cards).getByText("-2.000")).toBeInTheDocument();
    expect(within(cards).getByText("12.5%")).toBeInTheDocument();
  });

  it("lists newest first and reverses with the direction toggle", () => {
    const cards = renderDetail();
    const order = () =>
      within(cards)
        .getAllByTestId("loyalty-transaction-card")
        .map((el) => el.getAttribute("data-tx-id"));

    expect(order()).toEqual(["t-new", "t-old"]);

    fireEvent.click(within(cards).getByRole("button", { name: "Direção" }));

    expect(order()).toEqual(["t-old", "t-new"]);
  });

  it("sorts by expiration when selected", () => {
    const cards = renderDetail();

    fireEvent.change(within(cards).getByRole("combobox"), { target: { value: "expiresAt" } });

    // desc by expiresAt: the purchase has an expiry, the redeem has none ("")
    expect(
      within(cards)
        .getAllByTestId("loyalty-transaction-card")
        .map((el) => el.getAttribute("data-tx-id")),
    ).toEqual(["t-old", "t-new"]);
  });

  it("opens the edit dialog from the card actions menu", () => {
    const cards = renderDetail();
    const card = within(cards)
      .getAllByTestId("loyalty-transaction-card")
      .find((el) => el.getAttribute("data-tx-id") === "t-old") as HTMLElement;

    fireEvent.click(within(card).getByRole("button", { name: "Ações" }));
    fireEvent.click(screen.getByText("Editar"));

    expect(screen.getByTestId("edit-modal")).toHaveAttribute("data-tx-id", "t-old");
  });

  it("shows the empty state instead of cards when there are no transactions", () => {
    render(<LoyaltyProgramDetail program={program} report={{ summary, transactions: [] }} />);

    expect(screen.getByText("Nenhuma transação registrada.")).toBeInTheDocument();
    expect(screen.queryByTestId("loyalty-transaction-cards")).not.toBeInTheDocument();
  });
});
