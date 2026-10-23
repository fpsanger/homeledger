/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryCombobox } from "@/components/ui/category-combobox";

// cmdk observes its list element's size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView = jest.fn();

const categories = [
  { id: "food", name: "Alimentação", parentId: null },
  { id: "market", name: "Mercado", parentId: "food" },
];

describe("CategoryCombobox", () => {
  afterEach(() => jest.restoreAllMocks());

  it("focuses the search input without scrolling the page when opened", async () => {
    const focus = jest.spyOn(HTMLElement.prototype, "focus");
    render(<CategoryCombobox categories={categories} value="" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecione a categoria" }));
    const input = await screen.findByPlaceholderText("Buscar categoria...");

    const inputFocusCalls = focus.mock.calls.filter((_, i) => focus.mock.contexts[i] === input);
    expect(inputFocusCalls.length).toBeGreaterThan(0);
    for (const [options] of inputFocusCalls) {
      expect(options).toEqual({ preventScroll: true });
    }
  });

  it("does not scroll an item into view until the popup has been positioned", async () => {
    const scrollIntoView = Element.prototype.scrollIntoView as jest.Mock;
    scrollIntoView.mockClear();
    render(<CategoryCombobox categories={categories} value="" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Selecione a categoria" }));
    await screen.findByPlaceholderText("Buscar categoria...");

    expect(screen.queryByText("Mercado")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();

    expect(await screen.findByText("Mercado")).toBeInTheDocument();
  });
});
