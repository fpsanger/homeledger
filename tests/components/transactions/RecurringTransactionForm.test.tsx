/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { RecurringTransactionForm } from "@/components/transactions/RecurringTransactionForm";

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

const people = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

describe("RecurringTransactionForm — defaultPersonId", () => {
  it("pre-selects the person when defaultPersonId is provided", () => {
    render(<RecurringTransactionForm people={people} categories={[]} defaultPersonId="p1" />);
    expect(screen.getByLabelText("Pessoa")).toHaveValue("p1");
  });

  it("has no person selected when defaultPersonId is omitted", () => {
    render(<RecurringTransactionForm people={people} categories={[]} />);
    expect(screen.getByLabelText("Pessoa")).toHaveValue("");
  });

  it("shows all people as options", () => {
    render(<RecurringTransactionForm people={people} categories={[]} defaultPersonId="p2" />);
    const select = screen.getByLabelText("Pessoa");
    expect(select).toContainElement(screen.getByRole("option", { name: "Alice" }));
    expect(select).toContainElement(screen.getByRole("option", { name: "Bob" }));
  });
});
