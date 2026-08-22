/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrivacyProvider, usePrivacy } from "@/components/layout/PrivacyProvider";

function Consumer() {
  const { hidden, toggle } = usePrivacy();
  return (
    <button type="button" onClick={toggle}>
      {hidden ? "hidden" : "visible"}
    </button>
  );
}

describe("PrivacyProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to visible (not hidden) with no stored preference", () => {
    render(
      <PrivacyProvider>
        <Consumer />
      </PrivacyProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("visible");
  });

  it("reads hidden=true from localStorage on mount", () => {
    localStorage.setItem("hideValues", "true");
    render(
      <PrivacyProvider>
        <Consumer />
      </PrivacyProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("hidden");
  });

  it("toggle() flips state and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <PrivacyProvider>
        <Consumer />
      </PrivacyProvider>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("visible");

    await user.click(button);
    expect(button).toHaveTextContent("hidden");
    expect(localStorage.getItem("hideValues")).toBe("true");

    await user.click(button);
    expect(button).toHaveTextContent("visible");
    expect(localStorage.getItem("hideValues")).toBe("false");
  });
});
