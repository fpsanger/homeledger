/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import {
  LoyaltyPurchaseSimulator,
  type SimulatorProgram,
  type SimulatorSummary,
} from "@/components/loyalty/LoyaltyPurchaseSimulator";

// jsdom has no window.scrollTo, which the dialog's scroll lock calls on cleanup.
jest.mock("@/lib/scroll-lock", () => ({ lockBodyScroll: () => () => {} }));

const program: SimulatorProgram = {
  name: "LATAM Pass",
  referenceMinPer1kBrl: 24,
  referenceMaxPer1kBrl: 26,
};

const summary: SimulatorSummary = {
  currentLotsPoints: 10000,
  currentLotsCostBrl: 150, // R$ 15 / 1k
  avgRedeemValuePer1k: null,
};

function renderSimulator(
  overrides: { program?: Partial<SimulatorProgram>; summary?: Partial<SimulatorSummary> } = {},
) {
  return render(
    <LoyaltyPurchaseSimulator
      open
      program={{ ...program, ...overrides.program }}
      summary={{ ...summary, ...overrides.summary }}
      onClose={jest.fn()}
    />,
  );
}

function fill(points: string, paid: string) {
  fireEvent.change(screen.getByLabelText(/Pontos/), { target: { value: points } });
  fireEvent.change(screen.getByLabelText(/Valor pago/), { target: { value: paid } });
}

const plain = (el: HTMLElement) => el.textContent?.replace(/ /g, " ");

describe("LoyaltyPurchaseSimulator", () => {
  it("asks for input before showing a result", () => {
    renderSimulator();
    expect(screen.queryByTestId("simulator-verdict")).not.toBeInTheDocument();
    expect(screen.getByText(/Informe os pontos e o valor pago/)).toBeInTheDocument();
  });

  it("stays empty for a zero price", () => {
    renderSimulator();
    fill("10000", "0");
    expect(screen.queryByTestId("simulator-verdict")).not.toBeInTheDocument();
  });

  it("shows the effective cost per 1k and the before/after average", () => {
    renderSimulator();
    fill("10000", "200");
    expect(plain(screen.getByTestId("simulator-effective-cost"))).toBe("R$ 20,00");
    // (150 + 200) / 20000 * 1000 = 17.50
    expect(plain(screen.getByTestId("simulator-average"))).toBe("R$ 15,00 → R$ 17,50");
  });

  it.each([
    ["200", "GREAT", /abaixo do mínimo/],
    ["250", "OK", /dentro da faixa/],
    ["300", "NOT_WORTH", /acima do máximo/],
  ])("paying R$ %s for 10k points is %s", (paid, verdict, hint) => {
    renderSimulator();
    fill("10000", paid);
    expect(screen.getByTestId("simulator-verdict")).toHaveAttribute("data-verdict", verdict);
    expect(screen.getByTestId("simulator-reference").parentElement).toHaveTextContent(hint);
  });

  it("states the verdict in words, not only by color", () => {
    renderSimulator();
    fill("10000", "300");
    expect(screen.getByTestId("simulator-verdict")).toHaveTextContent("Não vale a pena");
  });

  it("warns when the average redemption does not cover the cost", () => {
    renderSimulator({ summary: { avgRedeemValuePer1k: 24 } });
    fill("10000", "250");
    expect(screen.getByTestId("simulator-verdict")).toHaveAttribute("data-verdict", "CAUTION");
    expect(plain(screen.getByTestId("simulator-redeem-average"))).toBe("R$ 24,00");
    expect(screen.getByText(/ROI projetado -4,0%|ROI projetado -4\.0%/)).toBeInTheDocument();
  });

  it("explains how to get a verdict when there is no reference and no redemption", () => {
    renderSimulator({
      program: { referenceMinPer1kBrl: null, referenceMaxPer1kBrl: null },
    });
    fill("10000", "200");
    expect(screen.getByTestId("simulator-verdict")).toHaveAttribute("data-verdict", "NO_REFERENCE");
    expect(screen.getByText("não definida")).toBeInTheDocument();
    expect(screen.getByText("sem resgates")).toBeInTheDocument();
  });

  it("handles a program with no lots yet", () => {
    renderSimulator({ summary: { currentLotsPoints: 0, currentLotsCostBrl: 0 } });
    fill("10000", "200");
    expect(plain(screen.getByTestId("simulator-average"))).toBe("sem lotes → R$ 20,00");
  });

  it("treats a single reference value as a fixed point", () => {
    renderSimulator({ program: { referenceMinPer1kBrl: 16, referenceMaxPer1kBrl: null } });
    fill("10000", "160");
    expect(screen.getByTestId("simulator-verdict")).toHaveAttribute("data-verdict", "OK");
    expect(plain(screen.getByTestId("simulator-reference"))).toBe("R$ 16,00");
  });
});
