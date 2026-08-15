/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { UnifiedTransactionForm } from "@/components/transactions/UnifiedTransactionForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/components/ui/category-combobox", () => ({
  CategoryCombobox: () => null,
}));
jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: () => null,
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
