/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkAddCreditCardPurchaseClient } from "@/components/credit-cards/bulk-add/BulkAddCreditCardPurchaseClient";
import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/credit-cards/bulk-add/submitPurchase", () => ({
  submitPurchase: jest.fn(),
}));

jest.mock("@/components/credit-cards/bulk-add/CardCombobox", () => ({
  CardCombobox: ({
    cards,
    value,
    onChange,
    disabled,
  }: {
    cards: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label="Cartão"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">Selecione</option>
      {cards.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  ),
}));

jest.mock("@/components/credit-cards/bulk-add/CardSection", () => ({
  CardSection: ({
    card,
    rows,
    onAddRow,
    onEditRow,
    onRemoveRow,
    onRemoveSection,
    disabled,
  }: {
    card: { id: string; name: string };
    rows: PurchaseRow[];
    onAddRow: () => void;
    onEditRow: (rowId: string, patch: Partial<PurchaseRow>) => void;
    onRemoveRow: (rowId: string) => void;
    onRemoveSection: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="section" data-card-id={card.id}>
      <span>{card.name}</span>
      {rows.map((row) => (
        <div key={row.rowId} data-testid="row" data-status={row.status}>
          <button
            type="button"
            onClick={() => onEditRow(row.rowId, { amount: "10,00" })}
            disabled={disabled}
          >
            Editar valor de {card.name}
          </button>
          <button type="button" onClick={() => onRemoveRow(row.rowId)} disabled={disabled}>
            Remover compra de {card.name}
          </button>
        </div>
      ))}
      <button type="button" onClick={onAddRow} disabled={disabled}>
        Adicionar compra a {card.name}
      </button>
      <button type="button" onClick={onRemoveSection} disabled={disabled}>
        Remover {card.name}
      </button>
    </div>
  ),
}));

const mockedSubmitPurchase = jest.mocked(submitPurchase);

const creditCards = [
  { id: "card-1", name: "Nubank" },
  { id: "card-2", name: "Itaú" },
];

function addCardSection(name: string) {
  const id = creditCards.find((c) => c.name === name)?.id ?? "";
  fireEvent.change(screen.getByLabelText("Cartão"), { target: { value: id } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar cartão" }));
}

describe("BulkAddCreditCardPurchaseClient", () => {
  beforeEach(() => {
    mockedSubmitPurchase.mockReset();
  });

  it("excludes cards that already have a section from the combobox", () => {
    render(
      <BulkAddCreditCardPurchaseClient people={[]} categories={[]} creditCards={creditCards} />,
    );

    addCardSection("Nubank");

    const options = screen.getByLabelText("Cartão").querySelectorAll("option");
    expect(Array.from(options).map((o) => o.textContent)).not.toContain("Nubank");
    expect(Array.from(options).map((o) => o.textContent)).toContain("Itaú");
  });

  it("starts a new section with one empty row", () => {
    render(
      <BulkAddCreditCardPurchaseClient people={[]} categories={[]} creditCards={creditCards} />,
    );

    addCardSection("Nubank");

    expect(screen.getAllByTestId("row")).toHaveLength(1);
  });

  it("adds another row to the same section", () => {
    render(
      <BulkAddCreditCardPurchaseClient people={[]} categories={[]} creditCards={creditCards} />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Nubank" }));

    expect(screen.getAllByTestId("row")).toHaveLength(2);
  });

  it("removes a section", () => {
    render(
      <BulkAddCreditCardPurchaseClient people={[]} categories={[]} creditCards={creditCards} />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Remover Nubank" }));

    expect(screen.queryByTestId("section")).not.toBeInTheDocument();
  });

  it("requires a person before submitting", async () => {
    render(
      <BulkAddCreditCardPurchaseClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={creditCards}
      />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    expect(await screen.findByText("Selecione a pessoa.")).toBeVisible();
    expect(mockedSubmitPurchase).not.toHaveBeenCalled();
  });

  it("submits every row across every section sequentially and continues after a failure", async () => {
    let rejectFirst: ((reason: Error) => void) | undefined;
    mockedSubmitPurchase
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce({ isDuplicate: false });

    render(
      <BulkAddCreditCardPurchaseClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={creditCards}
        defaultPersonId="person-1"
      />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
    addCardSection("Itaú");
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Itaú" }));

    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(1));
    expect(mockedSubmitPurchase).toHaveBeenNthCalledWith(
      1,
      "person-1",
      expect.objectContaining({ amount: "10,00" }),
      "card-1",
    );

    rejectFirst?.(new Error("Fechamento não configurado."));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(2));
    expect(mockedSubmitPurchase).toHaveBeenNthCalledWith(
      2,
      "person-1",
      expect.objectContaining({ amount: "10,00" }),
      "card-2",
    );
  });

  it("does not resubmit a succeeded row on retry", async () => {
    mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });

    render(
      <BulkAddCreditCardPurchaseClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={creditCards}
        defaultPersonId="person-1"
      />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));
    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Nubank" }));
    const editButtons = screen.getAllByRole("button", { name: "Editar valor de Nubank" });
    fireEvent.click(editButtons[editButtons.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(2));
  });
});
