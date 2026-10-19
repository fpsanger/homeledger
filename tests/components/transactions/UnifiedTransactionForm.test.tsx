/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UnifiedTransactionForm } from "@/components/transactions/UnifiedTransactionForm";

jest.mock("@/components/ui/month-picker", () => ({
  MonthPicker: ({
    id,
    ariaLabel,
    value,
    onChange,
    clearLabel,
    disabled,
  }: {
    id?: string;
    ariaLabel?: string;
    value: string;
    onChange: (value: string) => void;
    clearLabel?: string;
    disabled?: boolean;
  }) => (
    <input
      id={id}
      aria-label={ariaLabel}
      value={value}
      data-clear-label={clearLabel}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/components/ui/category-combobox", () => ({
  CategoryCombobox: () => null,
}));
jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: ({
    onChange,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    onChange?: (value: string) => void;
  }) => <input {...props} onChange={(event) => onChange?.(event.target.value)} />,
}));
jest.mock("@/components/ui/date-picker", () => ({
  DatePicker: () => null,
}));
jest.mock("@/hooks/useDuplicateCheck", () => ({
  useDuplicateCheck: () => null,
}));
jest.mock("@/hooks/useCreditCardDuplicateCheck", () => ({
  useCreditCardDuplicateCheck: () => null,
}));
jest.mock("@/hooks/useCrossEntityDuplicateCheck", () => ({
  useCrossEntityDuplicateCheck: () => null,
}));

const people = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];
const categories: never[] = [];
const creditCards: never[] = [];

const baseInitialValues = {
  type: "expense" as const,
  personId: "",
  amount: "",
  date: "2026-01-01",
  paymentMethod: "PIX",
  source: "SALARY",
  creditCardId: "",
  categoryId: "",
  description: "",
};

describe("UnifiedTransactionForm — defaultPersonId", () => {
  it("pre-selects the person when defaultPersonId is provided and no initialValues", () => {
    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={creditCards}
        defaultPersonId="p1"
      />,
    );
    expect(screen.getByLabelText("Pessoa")).toHaveValue("p1");
  });

  it("has no person selected when defaultPersonId is omitted", () => {
    render(
      <UnifiedTransactionForm people={people} categories={categories} creditCards={creditCards} />,
    );
    expect(screen.getByLabelText("Pessoa")).toHaveValue("");
  });

  it("initialValues.personId takes priority over defaultPersonId", () => {
    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={creditCards}
        defaultPersonId="p1"
        initialValues={{ ...baseInitialValues, personId: "p2" }}
      />,
    );
    expect(screen.getByLabelText("Pessoa")).toHaveValue("p2");
  });
});

describe("UnifiedTransactionForm — billing month (Fatura)", () => {
  const fixedCard = {
    id: "card-fixed",
    name: "Nubank",
    closureType: "FIXED" as const,
    fixedClosureDay: 10,
    fixedClosurePreviousMonth: false,
    closureNextMonth: false,
  };
  const variableCard = {
    ...fixedCard,
    id: "card-variable",
    name: "C6",
    closureType: "VARIABLE" as const,
    fixedClosureDay: null,
  };

  function renderCreditForm(creditCardId: string) {
    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={[fixedCard, variableCard]}
        initialValues={{
          ...baseInitialValues,
          type: "credit",
          personId: "p1",
          amount: "100,00",
          date: "2026-01-15",
          creditCardId,
        }}
      />,
    );
  }

  it("pre-fills a FIXED card's bill computed from its closure day", () => {
    renderCreditForm(fixedCard.id);
    expect(screen.getByLabelText("Fatura (mês)")).toHaveValue("2026-02");
  });

  it("pre-fills a VARIABLE card's bill with the purchase month", () => {
    renderCreditForm(variableCard.id);
    expect(screen.getByLabelText("Fatura (mês)")).toHaveValue("2026-01");
  });

  it("previews installments from the chosen bill and sends it on submit", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;
    renderCreditForm(variableCard.id);

    fireEvent.change(screen.getByLabelText("Fatura (mês)"), { target: { value: "2026-03" } });
    expect(screen.getByText(/Mar\/2026/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adicionar Compra com Cartão" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/installments");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      creditCardId: variableCard.id,
      billingMonth: "2026-03",
    });
  });
});

describe("UnifiedTransactionForm — installment amount mode", () => {
  it("clears the hidden total and installment count when entering installment amount mode", () => {
    const card = {
      id: "card-1",
      name: "Card",
      closureType: "FIXED" as const,
      fixedClosureDay: 20,
      fixedClosurePreviousMonth: false,
      closureNextMonth: false,
    };

    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={[card]}
        initialValues={{
          ...baseInitialValues,
          type: "credit",
          personId: "p1",
          amount: "300,00",
          date: "2026-01-15",
          creditCardId: card.id,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Valor da parcela" }));

    expect(screen.getByLabelText("Selecione o total")).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Valor total" }));
    expect(screen.getByLabelText("Valor Total")).toHaveValue("");
  });
});
