/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { UnifiedTransactionForm } from "@/components/transactions/UnifiedTransactionForm";

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

describe("UnifiedTransactionForm — credit-card closure", () => {
  it("rejects billing preview when the card closure day was not resolved", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const cardWithoutResolvedClosure = {
      id: "card-1",
      name: "Malformed fixed card",
      closureType: "FIXED" as const,
      fixedClosureDay: null,
      fixedClosurePreviousMonth: false,
      alwaysNextMonth: false,
      closureNextMonth: false,
    };

    try {
      expect(() =>
        render(
          <UnifiedTransactionForm
            people={people}
            categories={categories}
            creditCards={[cardWithoutResolvedClosure]}
            initialValues={{
              ...baseInitialValues,
              type: "credit",
              personId: "p1",
              amount: "100",
              date: "2026-01-15",
              creditCardId: cardWithoutResolvedClosure.id,
            }}
          />,
        ),
      ).toThrow("Credit card closure day must be resolved before calculating billing months");
    } finally {
      consoleError.mockRestore();
    }
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
      alwaysNextMonth: false,
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
