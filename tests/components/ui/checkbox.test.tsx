/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// base-ui listens to pointer events; jsdom has no PointerEvent.
if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

function renderCheckbox(props: Partial<React.ComponentProps<typeof Checkbox>> = {}) {
  const onCheckedChange = jest.fn();
  render(
    <div>
      <Checkbox id="accept" checked={false} onCheckedChange={onCheckedChange} {...props} />
      <Label htmlFor="accept">Aceito</Label>
    </div>,
  );
  return { onCheckedChange };
}

describe("Checkbox", () => {
  it("is reachable by its label", () => {
    renderCheckbox();
    expect(screen.getByRole("checkbox", { name: "Aceito" })).toBeInTheDocument();
  });

  it("reflects the checked prop", () => {
    renderCheckbox({ checked: true });
    expect(screen.getByRole("checkbox", { name: "Aceito" })).toBeChecked();
  });

  it("reports the new value when clicked", () => {
    const { onCheckedChange } = renderCheckbox();
    fireEvent.click(screen.getByRole("checkbox", { name: "Aceito" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("toggles when its label is clicked", () => {
    const { onCheckedChange } = renderCheckbox();
    fireEvent.click(screen.getByText("Aceito"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does nothing while disabled", () => {
    const { onCheckedChange } = renderCheckbox({ disabled: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "Aceito" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
