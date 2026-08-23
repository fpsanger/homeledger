/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { BillView } from "@/components/credit-cards/BillView";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock("@/components/transactions/UnifiedTransactionForm", () => ({
  UnifiedTransactionForm: ({ initialValues }: { initialValues: { personId: string } }) => (
    <div data-testid="unified-transaction-form" data-person-id={initialValues.personId} />
  ),
}));

jest.mock("@/components/credit-cards/CreditCardRefundForm", () => ({
  CreditCardRefundForm: ({ defaultPersonId }: { defaultPersonId?: string }) => (
    <div data-testid="refund-form" data-person-id={defaultPersonId} />
  ),
}));

function mockFetchResponses() {
  global.fetch = jest.fn((url: string) => {
    if (url.includes("/api/people")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ people: [{ id: "person-1", name: "Ana" }] }),
      });
    }
    if (url.includes("/api/categories")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ categories: [] }) });
    }
    if (url.includes("/api/credit-cards/bill")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ bill: [] }) });
    }
    if (url.includes("/api/credit-cards")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ cards: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as unknown as typeof fetch;
}

describe("BillView", () => {
  beforeEach(() => {
    mockFetchResponses();
  });

  it("prefills the Pessoa field in the 'Nova transação' dialog from initialPersonId", async () => {
    render(<BillView initialPersonId="person-1" />);

    fireEvent.click(await screen.findByRole("button", { name: /Nova compra/i }));

    expect(screen.getByTestId("unified-transaction-form")).toHaveAttribute(
      "data-person-id",
      "person-1",
    );
  });

  it("prefills the Pessoa field in the 'Novo estorno' dialog from initialPersonId", async () => {
    render(<BillView initialPersonId="person-1" />);

    fireEvent.click(await screen.findByRole("button", { name: /Estorno/i }));

    expect(screen.getByTestId("refund-form")).toHaveAttribute("data-person-id", "person-1");
  });

  it("does not prefill the Pessoa field when no initialPersonId is set", async () => {
    render(<BillView />);

    fireEvent.click(await screen.findByRole("button", { name: /Nova compra/i }));
    fireEvent.click(screen.getByRole("button", { name: /Estorno/i }));

    expect(screen.getByTestId("unified-transaction-form")).toHaveAttribute("data-person-id", "");
    expect(screen.getByTestId("refund-form")).toHaveAttribute("data-person-id", "");
  });
});
