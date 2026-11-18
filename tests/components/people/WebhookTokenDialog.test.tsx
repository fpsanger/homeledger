/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { WebhookTokenDialog } from "@/components/people/WebhookTokenDialog";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const writeText = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

describe("WebhookTokenDialog", () => {
  it("renders nothing without a token", () => {
    const { container } = render(
      <WebhookTokenDialog personName="Ana" token={null} onClose={jest.fn()} />,
    );

    expect(container.textContent).toBe("");
  });

  it("shows the token, whose person it belongs to and that it will not be shown again", () => {
    render(<WebhookTokenDialog personName="Ana" token="hl_abc123" onClose={jest.fn()} />);

    expect(screen.getByText("hl_abc123")).toBeTruthy();
    expect(screen.getByText(/Ana/)).toBeTruthy();
    expect(screen.getByText(/não será mostrado novamente/i)).toBeTruthy();
  });

  it("copies the token to the clipboard", async () => {
    render(<WebhookTokenDialog personName="Ana" token="hl_abc123" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar token" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("hl_abc123"));
    expect(toast.success).toHaveBeenCalled();
  });

  it("tells the user when the clipboard is not available", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<WebhookTokenDialog personName="Ana" token="hl_abc123" onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar token" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("closes from the Fechar button", () => {
    const onClose = jest.fn();
    render(<WebhookTokenDialog personName="Ana" token="hl_abc123" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalled();
  });
});
