/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { BulkFooter, combineTotals } from "@/components/transactions/bulk-add/BulkFooter";
import { SectionHeader } from "@/components/transactions/bulk-add/SectionHeader";

describe("BulkFooter", () => {
  const base = {
    count: 0,
    spendingCents: 0,
    progress: null,
    submitting: false,
    onSubmit: jest.fn(),
  };

  it("says nothing is waiting yet", () => {
    render(<BulkFooter {...base} />);

    expect(screen.getByText("Nada para enviar ainda.")).toBeVisible();
  });

  it("counts what will be sent and signs the spending", () => {
    render(<BulkFooter {...base} count={3} spendingCents={12050} />);

    expect(screen.getByText(/3 lançamentos para enviar/)).toBeVisible();
    expect(screen.getByText(/^−R\$\s120,50$/)).toBeVisible();
  });

  it("uses the singular for one entry and omits spending when there is none", () => {
    render(<BulkFooter {...base} count={1} />);

    expect(screen.getByText("1 lançamento para enviar")).toBeVisible();
  });

  it("shows progress and locks the button while sending", () => {
    render(<BulkFooter {...base} submitting progress={{ current: 2, total: 5 }} />);

    expect(screen.getByText("Enviando 2 de 5…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
  });

  it("sends on click", () => {
    const onSubmit = jest.fn();
    render(<BulkFooter {...base} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("combineTotals", () => {
  it("adds the counts and the spending of every section", () => {
    expect(
      combineTotals(
        { count: 2, expenseCents: 1000, incomeCents: 500 },
        { count: 1, expenseCents: 250, incomeCents: 0 },
      ),
    ).toEqual({ count: 3, spendingCents: 1250 });
  });
});

describe("SectionHeader", () => {
  it("shows expenses and incomes with their signs", () => {
    render(
      <SectionHeader
        id="t"
        title="Despesas e receitas"
        description="Descrição"
        totals={{ count: 2, expenseCents: 1050, incomeCents: 200000 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Despesas e receitas" })).toBeVisible();
    expect(screen.getByText(/−R\$\s10,50/)).toBeVisible();
    expect(screen.getByText(/\+R\$\s2\.000,00/)).toBeVisible();
  });

  it("shows no total when nothing is waiting", () => {
    render(
      <SectionHeader
        id="t"
        title="Compras"
        description="Descrição"
        totals={{ count: 0, expenseCents: 0, incomeCents: 0 }}
      />,
    );

    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});
