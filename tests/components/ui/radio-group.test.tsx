/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// base-ui listens to pointer events; jsdom has no PointerEvent.
if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

function renderGroup(value = "credit-card") {
  const onValueChange = jest.fn();
  render(
    <RadioGroup value={value} onValueChange={onValueChange} aria-label="Tipo de Extrato">
      <Label htmlFor="type-credit">
        <RadioGroupItem id="type-credit" value="credit-card" />
        Cartão de Crédito
      </Label>
      <Label htmlFor="type-debit">
        <RadioGroupItem id="type-debit" value="debit" />
        Débito
      </Label>
    </RadioGroup>,
  );
  return { onValueChange };
}

describe("RadioGroup", () => {
  it("renders one radio per item inside a radiogroup", () => {
    renderGroup();
    expect(screen.getByRole("radiogroup", { name: "Tipo de Extrato" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("marks only the selected value as checked", () => {
    renderGroup("debit");
    expect(screen.getByRole("radio", { name: "Débito" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cartão de Crédito" })).not.toBeChecked();
  });

  it("exposes data-checked on the selected radio, which the styles key off", () => {
    renderGroup("debit");
    expect(screen.getByRole("radio", { name: "Débito" })).toHaveAttribute("data-checked");
    expect(screen.getByRole("radio", { name: "Cartão de Crédito" })).not.toHaveAttribute(
      "data-checked",
    );
  });

  it("reports the value of the clicked item", () => {
    const { onValueChange } = renderGroup("credit-card");
    fireEvent.click(screen.getByRole("radio", { name: "Débito" }));
    expect(onValueChange).toHaveBeenCalledWith("debit", expect.anything());
  });
});
