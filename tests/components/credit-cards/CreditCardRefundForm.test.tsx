/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CreditCardRefundForm } from "@/components/credit-cards/CreditCardRefundForm";

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

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/components/ui/category-combobox", () => ({ CategoryCombobox: () => null }));
jest.mock("@/components/ui/date-picker", () => ({ DatePicker: () => null }));

const people = [
  { id: "person-1", name: "Ana" },
  { id: "person-2", name: "Bruno" },
];

describe("CreditCardRefundForm", () => {
  it("prefills the Pessoa select with defaultPersonId when provided", () => {
    render(
      <CreditCardRefundForm
        people={people}
        categories={[]}
        creditCards={[]}
        defaultPersonId="person-2"
        onSuccess={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Pessoa")).toHaveValue("person-2");
  });

  it("defaults the Pessoa select to empty when defaultPersonId is not provided", () => {
    render(
      <CreditCardRefundForm
        people={people}
        categories={[]}
        creditCards={[]}
        onSuccess={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Pessoa")).toHaveValue("");
  });

  it("sends the bill the user picked for a VARIABLE card", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;
    const card = {
      id: "card-1",
      name: "C6",
      closureType: "VARIABLE" as const,
      fixedClosureDay: null,
      fixedClosurePreviousMonth: false,
      closureNextMonth: false,
    };
    render(
      <CreditCardRefundForm
        people={people}
        categories={[]}
        creditCards={[card]}
        defaultCreditCardId="card-1"
        defaultPersonId="person-1"
        onSuccess={jest.fn()}
      />,
    );

    const today = new Date().toISOString().slice(0, 7);
    expect(screen.getByLabelText("Fatura (mês)")).toHaveValue(today);
    fireEvent.change(screen.getByLabelText("Fatura (mês)"), { target: { value: "2026-12" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "10,00" } });
    fireEvent.submit(screen.getByRole("button", { name: "Adicionar Estorno" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      creditCardId: "card-1",
      billingMonth: "2026-12",
    });
  });
});
