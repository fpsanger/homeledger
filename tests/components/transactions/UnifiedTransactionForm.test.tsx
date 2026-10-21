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
    expect(screen.getByText(/mar\/2026/)).toBeInTheDocument();

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

describe("UnifiedTransactionForm — linked total and installment amounts", () => {
  const card = {
    id: "card-1",
    name: "Card",
    closureType: "FIXED" as const,
    fixedClosureDay: 20,
    fixedClosurePreviousMonth: false,
    closureNextMonth: false,
  };

  function renderCreditForm() {
    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={[card]}
        initialValues={{
          ...baseInitialValues,
          type: "credit",
          personId: "p1",
          date: "2026-01-15",
          creditCardId: card.id,
        }}
      />,
    );
  }

  it("shows a single amount field while the purchase is not split into installments", () => {
    renderCreditForm();

    expect(screen.getByLabelText("Parcelas")).toHaveValue("1");
    expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor da parcela")).not.toBeInTheDocument();
  });

  it("lets the installment count be chosen before any amount is entered", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });

    expect(screen.getByLabelText("Parcelas")).toHaveValue("3");
    expect(screen.getByLabelText("Valor total")).toHaveValue("");
    expect(screen.getByLabelText("Valor da parcela")).toHaveValue("");
  });

  it("derives the installment amount from the total", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Valor total"), { target: { value: "300,00" } });

    expect(screen.getByLabelText("Valor da parcela")).toHaveValue("100,00");
  });

  it("derives the total from the installment amount", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Valor da parcela"), { target: { value: "50,00" } });

    expect(screen.getByLabelText("Valor total")).toHaveValue("150,00");
  });

  it("keeps the installment amount and moves the total when the count changes", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Valor da parcela"), { target: { value: "50,00" } });
    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "6" } });

    expect(screen.getByLabelText("Valor da parcela")).toHaveValue("50,00");
    expect(screen.getByLabelText("Valor total")).toHaveValue("300,00");
  });

  it("keeps the total and moves the installment amount when the count changes", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "300,00" } });
    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "4" } });

    expect(screen.getByLabelText("Valor total")).toHaveValue("300,00");
    expect(screen.getByLabelText("Valor da parcela")).toHaveValue("75,00");
  });

  it("submits the total derived from the installment amount", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Valor da parcela"), { target: { value: "50,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Compra com Cartão" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/installments");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      totalAmount: 150,
      numberOfInstallments: 3,
    });
  });

  it("surfaces the uneven last installment instead of hiding the rounding", () => {
    renderCreditForm();

    fireEvent.change(screen.getByLabelText("Parcelas"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Valor total"), { target: { value: "100,00" } });

    expect(screen.getByLabelText("Valor da parcela")).toHaveValue("33,33");
    expect(screen.getByText(/última parcela R\$\s33,34/)).toBeInTheDocument();
  });
});

describe("UnifiedTransactionForm — split credit card purchase", () => {
  const card = {
    id: "card-1",
    name: "Card",
    closureType: "FIXED" as const,
    fixedClosureDay: 10,
    fixedClosurePreviousMonth: false,
    closureNextMonth: false,
  };

  it("sends one installment and both split rows for the seeded person", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    render(
      <UnifiedTransactionForm
        people={people}
        categories={categories}
        creditCards={[card]}
        defaultPersonId="p1"
        initialValues={{
          ...baseInitialValues,
          type: "credit",
          personId: "p1",
          date: "2026-10-21",
          creditCardId: card.id,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "300,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Dividir" }));
    expect(screen.getByLabelText("Valor de Alice")).toHaveValue("300,00");

    fireEvent.change(screen.getByLabelText("Adicionar pessoa"), { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByLabelText("Valor de Alice")).toHaveValue("150,00");
    expect(screen.getByLabelText("Valor de Bob")).toHaveValue("150,00");

    fireEvent.click(screen.getByRole("button", { name: "Adicionar Compra com Cartão" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/installments");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      creditCardId: card.id,
      totalAmount: 300,
      numberOfInstallments: 1,
      billingMonth: "2026-11",
      splits: [
        { personId: "p1", amount: 150 },
        { personId: "p2", amount: 150 },
      ],
    });
  });
});
