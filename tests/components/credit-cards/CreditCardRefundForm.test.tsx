/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { CreditCardRefundForm } from "@/components/credit-cards/CreditCardRefundForm";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

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
});
