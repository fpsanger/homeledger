/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";
import { BulkAddClient } from "@/components/transactions/bulk-add/BulkAddClient";
import { submitRow } from "@/components/transactions/bulk-add/submitRow";

const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/transactions/bulk-add/submitRow", () => ({
  submitRow: jest.fn(),
}));

jest.mock("@/components/credit-cards/bulk-add/submitPurchase", () => ({
  submitPurchase: jest.fn(),
}));

jest.mock("@/components/transactions/bulk-add/BulkAddRow", () => ({
  ...jest.requireActual("@/components/transactions/bulk-add/BulkAddRow"),
  BulkAddRow: ({
    row,
    onChange,
    onRemove,
    disabled,
  }: {
    row: { status: string; error?: string };
    onChange: (patch: { amount: string }) => void;
    onRemove: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="row" data-status={row.status} data-disabled={String(Boolean(disabled))}>
      {row.error && <span>{row.error}</span>}
      <button type="button" onClick={() => onChange({ amount: "10,00" })} disabled={disabled}>
        Editar valor
      </button>
      <button type="button" onClick={onRemove} disabled={disabled}>
        Remover linha
      </button>
    </div>
  ),
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
    personId,
    onPersonChange,
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
    personId: string;
    onPersonChange: (id: string) => void;
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
        aria-label={`Pessoa de ${card.name}`}
        value={personId}
        onChange={(e) => onPersonChange(e.target.value)}
      />
      <input
        aria-label={`Fatura de ${card.name}`}
        value={billingMonth}
        onChange={(e) => onBillingMonthChange(e.target.value)}
      />
      {rows.map((row) => (
        <div
          key={row.rowId}
          data-testid="purchase"
          data-status={row.status}
          data-description={row.description}
          data-installments={row.numberOfInstallments}
          data-amount={row.amount}
        >
          {row.error && <span>{row.error}</span>}
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

const mockedSubmitRow = jest.mocked(submitRow);
const mockedSubmitPurchase = jest.mocked(submitPurchase);

const people = [{ id: "person-1", name: "Felipe" }];
const creditCards = [
  { id: "card-1", name: "Nubank", closureType: "FIXED" as const },
  { id: "card-2", name: "Itaú", closureType: "VARIABLE" as const },
];

function renderClient(defaultPersonId = "person-1") {
  return render(
    <BulkAddClient
      people={people}
      categories={[]}
      creditCards={creditCards}
      defaultPersonId={defaultPersonId}
    />,
  );
}

function addCardSection(name: string) {
  const id = creditCards.find((c) => c.name === name)?.id ?? "";
  fireEvent.change(screen.getByLabelText("Cartão"), { target: { value: id } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar cartão" }));
}

function submitAll() {
  fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));
}

describe("BulkAddClient", () => {
  beforeEach(() => {
    mockedSubmitRow.mockReset();
    mockedSubmitPurchase.mockReset();
    push.mockReset();
    refresh.mockReset();
    jest.mocked(toast.success).mockReset();
    jest.mocked(toast.error).mockReset();
  });

  describe("layout", () => {
    it("shows both sections at once, the cards one with an empty state", () => {
      renderClient();

      expect(screen.getByRole("heading", { name: "Despesas e receitas" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Compras no cartão" })).toBeVisible();
      expect(screen.getByText(/Escolha um cartão para lançar compras/)).toBeVisible();
      expect(screen.getAllByTestId("row")).toHaveLength(1);
      expect(screen.queryByTestId("section")).not.toBeInTheDocument();
    });
  });

  describe("normal section", () => {
    it("returns an invalid edited row to pending and clears its previous error", async () => {
      renderClient("");

      fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
      submitAll();
      expect(await screen.findByText("Selecione a pessoa.")).toBeVisible();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Editar valor" })).toBeEnabled(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));

      expect(screen.getByTestId("row")).toHaveAttribute("data-status", "pending");
      expect(screen.queryByText("Selecione a pessoa.")).not.toBeInTheDocument();
    });

    it("blocks adding, editing and removing rows while a request is in flight", async () => {
      let resolveRequest: ((value: { isDuplicate: boolean }) => void) | undefined;
      mockedSubmitRow.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          }),
      );

      renderClient();
      fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
      submitAll();

      await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(1));
      expect(screen.getByRole("button", { name: "Adicionar linha" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Editar valor" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Remover linha" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Adicionar cartão" })).toBeDisabled();
      expect(screen.getByText("Enviando 1 de 1…")).toBeVisible();

      resolveRequest?.({ isDuplicate: false });
      await waitFor(() => expect(push).toHaveBeenCalledWith("/transactions"));
    });

    it("submits rows sequentially and continues after a failure", async () => {
      let rejectFirst: ((reason: Error) => void) | undefined;
      mockedSubmitRow
        .mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              rejectFirst = reject;
            }),
        )
        .mockResolvedValueOnce({ isDuplicate: false });

      renderClient();
      fireEvent.click(screen.getByRole("button", { name: "Adicionar linha" }));
      for (const button of screen.getAllByRole("button", { name: "Editar valor" })) {
        fireEvent.click(button);
      }

      submitAll();
      await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(1));

      rejectFirst?.(new Error("Falha na primeira linha"));
      await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(2));
      expect(await screen.findByText("Falha na primeira linha")).toBeVisible();
      expect(push).not.toHaveBeenCalled();
      await waitFor(() => expect(refresh).toHaveBeenCalled());
    });

    it("does not submit successful rows again on retry", async () => {
      mockedSubmitRow.mockResolvedValueOnce({ isDuplicate: false });
      mockedSubmitRow.mockRejectedValueOnce(new Error("Falha"));

      renderClient();
      fireEvent.click(screen.getByRole("button", { name: "Adicionar linha" }));
      for (const button of screen.getAllByRole("button", { name: "Editar valor" })) {
        fireEvent.click(button);
      }
      submitAll();
      await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(2));
      await screen.findByText("Falha");

      mockedSubmitRow.mockResolvedValueOnce({ isDuplicate: false });
      submitAll();

      await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(3));
    });
  });

  describe("card section", () => {
    it("excludes cards that already have a block from the picker", () => {
      renderClient();

      addCardSection("Nubank");

      const options = Array.from(screen.getByLabelText("Cartão").querySelectorAll("option"));
      expect(options.map((o) => o.textContent)).not.toContain("Nubank");
      expect(options.map((o) => o.textContent)).toContain("Itaú");
      expect(screen.queryByText(/Escolha um cartão para lançar compras/)).not.toBeInTheDocument();
    });

    it("starts a block with one empty purchase, adds more and removes the block", () => {
      renderClient();

      addCardSection("Nubank");
      expect(screen.getAllByTestId("purchase")).toHaveLength(1);

      fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Nubank" }));
      expect(screen.getAllByTestId("purchase")).toHaveLength(2);

      fireEvent.click(screen.getByRole("button", { name: "Remover Nubank" }));
      expect(screen.queryByTestId("section")).not.toBeInTheDocument();
    });

    it("copies category, installments and description into a row below the source", () => {
      renderClient();

      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
      fireEvent.click(screen.getByRole("button", { name: "Copiar compra de Nubank" }));

      const purchases = screen.getAllByTestId("purchase");
      expect(purchases).toHaveLength(2);
      expect(purchases[1]).toHaveAttribute("data-description", "Mercado");
      expect(purchases[1]).toHaveAttribute("data-installments", "6");
      expect(purchases[1]).toHaveAttribute("data-amount", "");
    });

    it("starts every block's bill empty: automatic for FIXED, required for VARIABLE", () => {
      renderClient();
      addCardSection("Nubank");
      addCardSection("Itaú");

      expect(screen.getByLabelText("Fatura de Nubank")).toHaveValue("");
      expect(screen.getByLabelText("Fatura de Itaú")).toHaveValue("");
    });

    it("gives each block the default person, changeable per block", () => {
      renderClient();
      addCardSection("Nubank");
      addCardSection("Itaú");

      fireEvent.change(screen.getByLabelText("Pessoa de Itaú"), { target: { value: "person-2" } });

      expect(screen.getByLabelText("Pessoa de Nubank")).toHaveValue("person-1");
      expect(screen.getByLabelText("Pessoa de Itaú")).toHaveValue("person-2");
    });

    it("flags a block without a person instead of submitting it", async () => {
      renderClient("");

      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
      submitAll();

      expect(await screen.findByText("Selecione a pessoa.")).toBeVisible();
      expect(mockedSubmitPurchase).not.toHaveBeenCalled();
    });

    it("flags a VARIABLE block without a bill instead of submitting it", async () => {
      renderClient();

      addCardSection("Itaú");
      fireEvent.change(screen.getByLabelText("Fatura de Itaú"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Itaú" }));
      submitAll();

      expect(await screen.findByText("Informe a fatura (mês).")).toBeVisible();
      expect(mockedSubmitPurchase).not.toHaveBeenCalled();
    });

    it("sends the block's bill for every row and a row's own bill when overridden", async () => {
      mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });
      renderClient();

      addCardSection("Itaú");
      fireEvent.change(screen.getByLabelText("Fatura de Itaú"), { target: { value: "2026-11" } });
      fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Itaú" }));
      for (const button of screen.getAllByRole("button", { name: "Editar valor de Itaú" })) {
        fireEvent.click(button);
      }
      fireEvent.click(screen.getAllByRole("button", { name: "Outra fatura em Itaú" })[1]);
      submitAll();

      await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(2));
      expect(mockedSubmitPurchase.mock.calls.map((call) => call[3])).toEqual([
        "2026-11",
        "2026-12",
      ]);
    });
  });

  describe("submitting both sections", () => {
    it("skips the untouched starter row when only card purchases were entered", async () => {
      mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });
      renderClient();

      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
      submitAll();

      await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(1));
      expect(mockedSubmitRow).not.toHaveBeenCalled();
      expect(mockedSubmitPurchase).toHaveBeenCalledWith(
        "person-1",
        expect.objectContaining({ amount: "10,00" }),
        "card-1",
        "",
      );
    });

    it("sends the normal rows first, then every card block, and goes to the transactions", async () => {
      const order: string[] = [];
      mockedSubmitRow.mockImplementation(async () => {
        order.push("normal");
        return { isDuplicate: false };
      });
      mockedSubmitPurchase.mockImplementation(async (_p, _r, cardId) => {
        order.push(cardId);
        return { isDuplicate: false };
      });
      renderClient();

      fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
      addCardSection("Itaú");
      fireEvent.change(screen.getByLabelText("Fatura de Itaú"), { target: { value: "2026-09" } });
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Itaú" }));
      submitAll();

      await waitFor(() => expect(push).toHaveBeenCalledWith("/transactions"));
      expect(order).toEqual(["normal", "card-1", "card-2"]);
      expect(refresh).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("3 lançamento(s) salvo(s).");
    });

    it("stays on the page and flags the failed purchase when a row fails", async () => {
      mockedSubmitPurchase.mockRejectedValue(new Error("Fechamento não configurado."));
      renderClient();

      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));
      submitAll();

      expect(await screen.findByText("Fechamento não configurado.")).toBeVisible();
      expect(screen.getByTestId("purchase")).toHaveAttribute("data-status", "error");
      expect(push).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("1 linha(s) com erro. Corrija e envie novamente.");
    });

    it("does not resubmit a purchase that already succeeded", async () => {
      mockedSubmitPurchase.mockResolvedValueOnce({ isDuplicate: false });
      mockedSubmitPurchase.mockRejectedValueOnce(new Error("Falha"));
      renderClient();

      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar compra a Nubank" }));
      for (const button of screen.getAllByRole("button", { name: "Editar valor de Nubank" })) {
        fireEvent.click(button);
      }
      submitAll();
      await screen.findByText("Falha");

      mockedSubmitPurchase.mockResolvedValueOnce({ isDuplicate: false });
      submitAll();

      await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(3));
    });

    it("says there is nothing to send when every row is untouched", () => {
      renderClient();

      submitAll();

      expect(toast.error).toHaveBeenCalledWith("Nada para enviar.");
      expect(mockedSubmitRow).not.toHaveBeenCalled();
      expect(mockedSubmitPurchase).not.toHaveBeenCalled();
    });

    it("counts what is waiting to be sent in the footer", () => {
      renderClient();
      expect(screen.getByText("Nada para enviar ainda.")).toBeVisible();

      fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
      addCardSection("Nubank");
      fireEvent.click(screen.getByRole("button", { name: "Editar valor de Nubank" }));

      expect(screen.getByText(/2 lançamentos para enviar/)).toBeVisible();
    });
  });
});
