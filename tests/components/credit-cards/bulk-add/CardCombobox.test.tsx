/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { CardCombobox } from "@/components/credit-cards/bulk-add/CardCombobox";

// cmdk observes its list element's size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView = jest.fn();

const cards = [
  { id: "card-1", name: "Nubank" },
  { id: "card-2", name: "Itaú" },
];

describe("CardCombobox", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(<CardCombobox cards={cards} value="" onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Selecione o cartão" })).toBeVisible();
  });

  it("shows the selected card's name as the trigger label", () => {
    render(<CardCombobox cards={cards} value="card-2" onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Itaú" })).toBeVisible();
  });

  it("opens the list and calls onChange when an item is picked", async () => {
    const onChange = jest.fn();
    render(<CardCombobox cards={cards} value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecione o cartão" }));

    const option = await screen.findByText("Nubank");
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("card-1");
  });

  it("does not scroll an item into view until the popup has been positioned", async () => {
    const scrollIntoView = Element.prototype.scrollIntoView as jest.Mock;
    scrollIntoView.mockClear();
    render(<CardCombobox cards={cards} value="" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecione o cartão" }));
    await screen.findByPlaceholderText("Buscar cartão...");

    expect(screen.queryByText("Nubank")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();

    expect(await screen.findByText("Nubank")).toBeInTheDocument();
  });

  it("only lists the cards it was given", async () => {
    render(<CardCombobox cards={[cards[0]]} value="" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecione o cartão" }));

    await screen.findByText("Nubank");
    expect(screen.queryByText("Itaú")).not.toBeInTheDocument();
  });

  it("disables the trigger when disabled", () => {
    render(<CardCombobox cards={cards} value="" onChange={jest.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Selecione o cartão" })).toBeDisabled();
  });
});
