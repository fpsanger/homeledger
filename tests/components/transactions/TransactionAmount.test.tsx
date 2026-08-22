/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { PrivacyProvider } from "@/components/layout/PrivacyProvider";
import { TransactionAmount } from "@/components/transactions/TransactionAmount";

describe("TransactionAmount — privacy masking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the real formatted amount when privacy is off", () => {
    render(
      <PrivacyProvider>
        <TransactionAmount type="EXPENSE" amount={100} />
      </PrivacyProvider>,
    );
    expect(screen.getByText(/100,00/)).toBeInTheDocument();
  });

  it("shows a fixed mask instead of the amount when privacy is on", () => {
    localStorage.setItem("hideValues", "true");
    render(
      <PrivacyProvider>
        <TransactionAmount type="EXPENSE" amount={100} />
      </PrivacyProvider>,
    );
    expect(screen.queryByText(/100,00/)).not.toBeInTheDocument();
    expect(screen.getByText("R$ ••••••")).toBeInTheDocument();
  });
});
