/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { submitPurchase } from "@/components/credit-cards/bulk-add/submitPurchase";
import { BulkAddClient } from "@/components/transactions/bulk-add/BulkAddClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock("@/components/credit-cards/bulk-add/submitPurchase", () => ({
  submitPurchase: jest.fn(),
}));

// Popover-based pickers need a real browser; the amount fields and sections under test are real.
jest.mock("@/components/ui/category-combobox", () => ({ CategoryCombobox: () => null }));
jest.mock("@/components/ui/date-picker", () => ({ DatePicker: () => null }));
jest.mock("@/components/ui/month-picker", () => ({ MonthPicker: () => null }));
jest.mock("@/components/credit-cards/bulk-add/CardCombobox", () => ({
  CardCombobox: ({
    cards,
    onChange,
  }: {
    cards: { id: string }[];
    onChange: (id: string) => void;
  }) => (
    <button type="button" onClick={() => onChange(cards[0].id)}>
      Escolher primeiro cartão
    </button>
  ),
}));
jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: ({
    value,
    onChange,
    "aria-label": ariaLabel,
  }: {
    value: string;
    onChange: (v: string) => void;
    "aria-label"?: string;
  }) => (
    <input
      aria-label={ariaLabel ?? "Valor"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockedSubmitPurchase = jest.mocked(submitPurchase);

describe("card purchases on the unified bulk page", () => {
  beforeEach(() => mockedSubmitPurchase.mockReset());

  it("sends the linked total of a purchase typed by its installment amount", async () => {
    mockedSubmitPurchase.mockResolvedValue({ isDuplicate: false });
    render(
      <BulkAddClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={[{ id: "card-1", name: "Nubank", closureType: "FIXED" }]}
        defaultPersonId="person-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Escolher primeiro cartão" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar cartão" }));
    const card = within(screen.getByRole("region", { name: "Compras no Nubank" }));

    expect(card.getByText("à vista")).toBeVisible();
    fireEvent.change(card.getByLabelText("Número de parcelas"), { target: { value: "4" } });
    fireEvent.change(card.getByLabelText("Valor da parcela"), { target: { value: "25,00" } });

    expect(card.getByLabelText("Valor total")).toHaveValue("100,00");
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitPurchase).toHaveBeenCalledTimes(1));
    expect(mockedSubmitPurchase).toHaveBeenCalledWith(
      "person-1",
      expect.objectContaining({ amount: "100,00", numberOfInstallments: "4" }),
      "card-1",
      "",
    );
  });

  it("keeps the typed installment amount when the count changes", () => {
    render(
      <BulkAddClient
        people={[]}
        categories={[]}
        creditCards={[{ id: "card-1", name: "Nubank", closureType: "FIXED" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Escolher primeiro cartão" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar cartão" }));
    const card = within(screen.getByRole("region", { name: "Compras no Nubank" }));
    fireEvent.change(card.getByLabelText("Número de parcelas"), { target: { value: "2" } });
    fireEvent.change(card.getByLabelText("Valor da parcela"), { target: { value: "30,00" } });
    fireEvent.change(card.getByLabelText("Número de parcelas"), { target: { value: "5" } });

    expect(card.getByLabelText("Valor da parcela")).toHaveValue("30,00");
    expect(card.getByLabelText("Valor total")).toHaveValue("150,00");
  });
});
