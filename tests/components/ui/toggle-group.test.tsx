/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// base-ui listens to pointer events; jsdom has no PointerEvent.
if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

function renderGroup(value = "table") {
  const onValueChange = jest.fn();
  render(
    <ToggleGroup value={value} onValueChange={onValueChange} aria-label="Visualização">
      <ToggleGroupItem value="table">Tabela</ToggleGroupItem>
      <ToggleGroupItem value="chart">Gráfico</ToggleGroupItem>
    </ToggleGroup>,
  );
  return { onValueChange };
}

describe("ToggleGroup", () => {
  it("marks only the selected item as pressed", () => {
    renderGroup("chart");
    expect(screen.getByRole("button", { name: "Gráfico" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tabela" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the value of the clicked item", () => {
    const { onValueChange } = renderGroup("table");
    fireEvent.click(screen.getByRole("button", { name: "Gráfico" }));
    expect(onValueChange).toHaveBeenCalledWith("chart");
  });

  it("keeps the selection when the pressed item is clicked again", () => {
    const { onValueChange } = renderGroup("table");
    fireEvent.click(screen.getByRole("button", { name: "Tabela" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does nothing for a disabled item", () => {
    const onValueChange = jest.fn();
    render(
      <ToggleGroup value="table" onValueChange={onValueChange}>
        <ToggleGroupItem value="table">Tabela</ToggleGroupItem>
        <ToggleGroupItem value="chart" disabled>
          Gráfico
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gráfico" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
