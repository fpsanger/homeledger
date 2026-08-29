/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopNav } from "@/components/layout/TopNav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const toggleTheme = jest.fn();
jest.mock("@/components/layout/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggle: toggleTheme }),
}));

const togglePrivacy = jest.fn();
let hidden = false;
jest.mock("@/components/layout/PrivacyProvider", () => ({
  usePrivacy: () => ({ hidden, toggle: togglePrivacy }),
}));

beforeEach(() => {
  hidden = false;
  toggleTheme.mockClear();
  togglePrivacy.mockClear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ people: [] }) });
});

describe("TopNav — privacy toggle", () => {
  it("renders the hide-values button in both desktop and mobile nav when visible", () => {
    render(<TopNav />);
    const buttons = screen.getAllByLabelText("Hide values");
    expect(buttons).toHaveLength(2);
  });

  it("renders the show-values button when privacy is hidden", () => {
    hidden = true;
    render(<TopNav />);
    const buttons = screen.getAllByLabelText("Show values");
    expect(buttons).toHaveLength(2);
  });

  it("calls togglePrivacy when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<TopNav />);
    const [button] = screen.getAllByLabelText("Hide values");
    await user.click(button);
    expect(togglePrivacy).toHaveBeenCalledTimes(1);
  });
});
