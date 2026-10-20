/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EditRecurringDialog } from "@/components/transactions/EditRecurringDialog";

const refresh = jest.fn();
const toastError = jest.fn();
const toastSuccess = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

jest.mock("@/components/layout/PrivacyProvider", () => ({
  usePrivacy: () => ({ hidden: false }),
}));

jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
  }) => <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />,
}));

jest.mock("@/components/ui/category-combobox", () => ({
  CategoryCombobox: () => null,
}));

jest.mock("@/components/ui/month-picker", () => ({
  MonthPicker: ({
    id,
    ariaLabel,
    value,
    onChange,
    minValue,
    maxValue,
  }: {
    id?: string;
    ariaLabel?: string;
    value: string;
    onChange: (value: string) => void;
    minValue?: string;
    maxValue?: string;
  }) => (
    <input
      id={id}
      aria-label={ariaLabel}
      value={value}
      data-min={minValue}
      data-max={maxValue}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// A 12-month series of R$ 1.200,00: January through December 2026 (endDate is exclusive).
const rule = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 1200,
  description: "Aluguel",
  paymentMethod: "PIX",
  categoryId: null,
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2027-01-01T00:00:00.000Z",
};

// The April occurrence, as the monthly view projects it.
const aprilRow = {
  id: "rule-1",
  personId: "person-1",
  type: "EXPENSE" as const,
  amount: 1200,
  date: "2026-04-01T00:00:00.000Z",
  description: "Aluguel",
  paymentMethod: "PIX",
};

function mockFetch(patchResponse: { ok: boolean; body?: unknown } = { ok: true }) {
  const fetchMock = jest.fn((_url: string, init?: RequestInit) => {
    if (init?.method === "PATCH") {
      return Promise.resolve({
        ok: patchResponse.ok,
        json: async () => patchResponse.body ?? rule,
      } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => rule } as Response);
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function renderDialog() {
  const onClose = jest.fn();
  render(
    <EditRecurringDialog
      transaction={aprilRow}
      people={[{ id: "person-1", name: "Felipe" }]}
      categories={[]}
      onClose={onClose}
    />,
  );
  await screen.findByLabelText("Alterar a partir de");
  return { onClose };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch();
});

describe("EditRecurringDialog", () => {
  it("loads the rule behind the clicked occurrence", async () => {
    const fetchMock = mockFetch();
    await renderDialog();

    expect(fetchMock).toHaveBeenCalledWith("/api/recurring-transactions/rule-1");
  });

  it("defaults the effective month to the month of the clicked row", async () => {
    await renderDialog();

    expect(screen.getByLabelText("Alterar a partir de")).toHaveValue("2026-04");
  });

  it("clamps the month picker to the series window", async () => {
    await renderDialog();

    const picker = screen.getByLabelText("Alterar a partir de");
    expect(picker).toHaveAttribute("data-min", "2026-01");
    expect(picker).toHaveAttribute("data-max", "2026-12");
  });

  it("shows the series range and current value as context", async () => {
    await renderDialog();

    expect(screen.getByText("jan/2026 — dez/2026", { exact: false })).toBeInTheDocument();
  });

  it("keeps review disabled until something changes", async () => {
    await renderDialog();

    expect(screen.getByRole("button", { name: "Revisar alteração" })).toBeDisabled();
  });

  it("shows both periods on review and writes nothing yet", async () => {
    const fetchMock = mockFetch();
    await renderDialog();

    fireEvent.change(screen.getByLabelText("Novo valor mensal"), { target: { value: "1450,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar alteração" }));

    expect(await screen.findByText("Mantém")).toBeInTheDocument();
    expect(screen.getByText("jan/2026 — mar/2026", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Passa a")).toBeInTheDocument();
    expect(screen.getByText("abr/2026 — dez/2026", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText("3 meses mantêm o valor atual, 9 meses passam para o novo valor."),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("returns to the form with values intact when going back", async () => {
    await renderDialog();

    fireEvent.change(screen.getByLabelText("Novo valor mensal"), { target: { value: "1450,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar alteração" }));
    fireEvent.click(await screen.findByRole("button", { name: "Voltar" }));

    expect(await screen.findByLabelText("Novo valor mensal")).toHaveValue("1450,00");
  });

  it("patches with the chosen effective month on confirm", async () => {
    const fetchMock = mockFetch();
    const { onClose } = await renderDialog();

    fireEvent.change(screen.getByLabelText("Alterar a partir de"), {
      target: { value: "2026-06" },
    });
    fireEvent.change(screen.getByLabelText("Novo valor mensal"), { target: { value: "1450,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar alteração" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall?.[1]?.body as string)).toEqual({
      effectiveFrom: "2026-06",
      amount: 1450,
      description: "Aluguel",
      categoryId: null,
      paymentMethod: "PIX",
    });
    expect(refresh).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Recorrência atualizada.");
  });

  it("covers the whole series when the effective month is the first month", async () => {
    await renderDialog();

    fireEvent.change(screen.getByLabelText("Alterar a partir de"), {
      target: { value: "2026-01" },
    });
    fireEvent.change(screen.getByLabelText("Novo valor mensal"), { target: { value: "1450,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar alteração" }));

    expect(await screen.findByText("Passa a")).toBeInTheDocument();
    expect(screen.queryByText("Mantém")).not.toBeInTheDocument();
    expect(
      screen.getByText("Todos os 12 meses da recorrência passam para o novo valor."),
    ).toBeInTheDocument();
  });

  it("stays on review and reports the error when the patch fails", async () => {
    mockFetch({ ok: false, body: { error: "Mês fora do período" } });
    const { onClose } = await renderDialog();

    fireEvent.change(screen.getByLabelText("Novo valor mensal"), { target: { value: "1450,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar alteração" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Mês fora do período"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });
});
