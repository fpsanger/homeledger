/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkAddCreditCardPurchaseClient } from "@/components/credit-cards/bulk-add/BulkAddCreditCardPurchaseClient";
import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";

const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
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
    billingMonth,
    onBillingMonthChange,
    onAddRow,
    onEditRow,
    onRemoveRow,
    onDuplicateRow,
    onRemoveSection,
    disabled,
  }: {
    card: { id: string; name: string };
    rows: PurchaseRow[];
    billingMonth: string;
    onBillingMonthChange: (value: string) => void;
    onAddRow: () => void;
    onEditRow: (rowId: string, patch: Partial<PurchaseRow>) => void;
    onRemoveRow: (rowId: string) => void;
    onDuplicateRow: (rowId: string) => void;
    onRemoveSection: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="section" data-card-id={card.id}>
      <span>{card.name}</span>
      <input
        aria-label={`Fatura de ${card.name}`}
        value={billingMonth}
        onChange={(e) => onBillingMonthChange(e.target.value)}
      />
      {rows.map((row) => (
        <div
          key={row.rowId}
          data-testid="row"
          data-status={row.status}
          data-description={row.description}
          data-installments={row.numberOfInstallments}
          data-amount={row.amount}
        >
          <button
            type="button"
            onClick={() =>
              onEditRow(row.rowId, {
                amount: "10,00",
                description: "Mercado",
                numberOfInstallments: "6",
              })
            }
            disabled={disabled}
          >
            Editar valor de {card.name}
          </button>
          <button
            type="button"
            onClick={() => onEditRow(row.rowId, { billingMonth: "2026-12" })}
            disabled={disabled}
          >
            Outra fatura em {card.name}
          </button>
          <button type="button" onClick={() => onDuplicateRow(row.rowId)} disabled={disabled}>
            Copiar compra de {card.name}
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
  { id: "card-1", name: "Nubank", closureType: "FIXED" as const },
  { id: "card-2", name: "Itaú", closureType: "VARIABLE" as const },
];

const currentMonth = new Date().toISOString().slice(0, 7);

function renderWithPerson() {
  render(
    <BulkAddCreditCardPurchaseClient
      people={[{ id: "person-1", name: "Felipe" }]}
      categories={[]}
      creditCards={creditCards}
      defaultPersonId="person-1"
    />,
  );
}

function addCardSection(name: string) {
  const id = creditCards.find((c) => c.name === name)?.id ?? "";
  fireEvent.change(screen.getByLabelText("Cartão"), { target: { value: id } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar cartão" }));
}

describe("BulkAddCreditCardPurchaseClient", () => {
  beforeEach(() => {
    mockedSubmitPurchase.mockReset();
    push.mockReset();
    refresh.mockReset();
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
      "",
    );

    rejectFirst?.(new Error("Fechamento não configurado."));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(2));
    expect(mockedSubmitPurchase).toHaveBeenNthCalledWith(
      2,
      "person-1",
      expect.objectContaining({ amount: "10,00" }),
      "card-2",
      currentMonth,
    );
  });

  it("copies category, installments and description into a new row below the source", () => {
    render(
      <BulkAddCreditCardPurchaseClient people={[]} categories={[]} creditCards={creditCards} />,
    );

    addCardSection("Nubank");
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar compra de Nubank" }));

    const rows = screen.getAllByTestId("row");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveAttribute("data-description", "Mercado");
    expect(rows[1]).toHaveAttribute("data-installments", "6");
    expect(rows[1]).toHaveAttribute("data-amount", "");
    expect(rows[1]).toHaveAttribute("data-status", "pending");
  });

  it("returns to the transactions page once every row succeeds", async () => {
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

    await waitFor(() => expect(push).toHaveBeenCalledWith("/transactions"));
  });

  it("stays on the page when a row fails", async () => {
    mockedSubmitPurchase.mockRejectedValue(new Error("Fechamento não configurado."));

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
    await waitFor(() => expect(screen.getByTestId("row")).toHaveAttribute("data-status", "error"));
    expect(push).not.toHaveBeenCalled();
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

  it("defaults a VARIABLE section's bill to the current month and a FIXED one to automatic", () => {
    renderWithPerson();
    addCardSection("Nubank");
    addCardSection("Itaú");

    expect(screen.getByLabelText("Fatura de Nubank")).toHaveValue("");
    expect(screen.getByLabelText("Fatura de Itaú")).toHaveValue(currentMonth);
  });

  it("sends the section's bill for every row and a row's own bill when overridden", async () => {
    mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });
    renderWithPerson();

    addCardSection("Itaú");
    fireEvent.change(screen.getByLabelText("Fatura de Itaú"), { target: { value: "2026-11" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Itaú" }));
    const editButtons = screen.getAllByRole("button", { name: "Editar valor de Itaú" });
    for (const button of editButtons) fireEvent.click(button);
    fireEvent.click(screen.getAllByRole("button", { name: "Outra fatura em Itaú" })[1]);

    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(2));
    expect(mockedSubmitPurchase.mock.calls.map((call) => call[3])).toEqual(["2026-11", "2026-12"]);
  });

  it("flags rows of a VARIABLE section without a bill instead of submitting them", async () => {
    renderWithPerson();

    addCardSection("Itaú");
    fireEvent.change(screen.getByLabelText("Fatura de Itaú"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar valor de Itaú" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(screen.getByTestId("row")).toHaveAttribute("data-status", "error"));
    expect(mockedSubmitPurchase).not.toHaveBeenCalled();
  });
});
