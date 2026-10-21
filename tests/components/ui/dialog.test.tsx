/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { Dialog } from "@/components/ui/dialog";

function renderDialog() {
  const onClose = jest.fn();
  const { container } = render(
    <Dialog open onClose={onClose} title="Editar Transação">
      <p>conteúdo</p>
    </Dialog>,
  );
  const backdrop = container.querySelector("[aria-hidden='true']");
  if (!backdrop) throw new Error("backdrop not rendered");
  return { onClose, backdrop };
}

describe("Dialog", () => {
  it("does not close when the backdrop is clicked", () => {
    const { onClose, backdrop } = renderDialog();
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("closes when the header close button is clicked", () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape is pressed", () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={jest.fn()} title="Editar Transação">
        <p>conteúdo</p>
      </Dialog>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
