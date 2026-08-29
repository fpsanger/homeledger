/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { InvestmentForm } from "@/components/transactions/InvestmentForm";

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

global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({ transactions: [] }) }),
) as jest.Mock;

const people = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

describe("InvestmentForm — defaultPersonId", () => {
  it("pre-selects the person when defaultPersonId is provided", async () => {
    render(<InvestmentForm people={people} categories={[]} defaultPersonId="p1" />);
    expect(await screen.findByLabelText("Pessoa")).toHaveValue("p1");
  });

  it("has no person selected when defaultPersonId is omitted", async () => {
    render(<InvestmentForm people={people} categories={[]} />);
    expect(await screen.findByLabelText("Pessoa")).toHaveValue("");
  });

  it("shows all people as options", async () => {
    render(<InvestmentForm people={people} categories={[]} defaultPersonId="p1" />);
    const select = await screen.findByLabelText("Pessoa");
    expect(select).toContainElement(screen.getByRole("option", { name: "Alice" }));
    expect(select).toContainElement(screen.getByRole("option", { name: "Bob" }));
  });
});
