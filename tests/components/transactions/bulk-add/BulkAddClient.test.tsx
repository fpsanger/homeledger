/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkAddClient } from "@/components/transactions/bulk-add/BulkAddClient";
import { submitRow } from "@/components/transactions/bulk-add/submitRow";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/transactions/bulk-add/submitRow", () => ({
  submitRow: jest.fn(),
}));

jest.mock("@/components/transactions/bulk-add/BulkAddRow", () => ({
  BulkAddRow: ({
    row,
    onChange,
    onRemove,
    disabled,
  }: {
    row: { status: string; error?: string };
    onChange: (patch: { amount: string }) => void;
    onRemove: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="row" data-status={row.status} data-disabled={String(Boolean(disabled))}>
      {row.error && <span>{row.error}</span>}
      <button type="button" onClick={() => onChange({ amount: "10,00" })} disabled={disabled}>
        Editar valor
      </button>
      <button type="button" onClick={onRemove} disabled={disabled}>
        Remover linha
      </button>
    </div>
  ),
}));

const mockedSubmitRow = jest.mocked(submitRow);

describe("BulkAddClient", () => {
  beforeEach(() => {
    mockedSubmitRow.mockReset();
  });

  it("returns an invalid edited row to pending and clears its previous error", async () => {
    render(<BulkAddClient people={[]} categories={[]} creditCards={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));
    expect(await screen.findByText("Selecione a pessoa.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));

    expect(screen.getByTestId("row")).toHaveAttribute("data-status", "pending");
    expect(screen.queryByText("Selecione a pessoa.")).not.toBeInTheDocument();
  });

  it("blocks adding, editing and removing rows while a request is in flight", async () => {
    let resolveRequest: ((value: { isDuplicate: boolean }) => void) | undefined;
    mockedSubmitRow.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(
      <BulkAddClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={[]}
        defaultPersonId="person-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Adicionar linha" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editar valor" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remover linha" })).toBeDisabled();

    resolveRequest?.({ isDuplicate: false });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Adicionar linha" })).toBeEnabled(),
    );
  });

  it("submits rows sequentially and continues after a failure", async () => {
    let rejectFirst: ((reason: Error) => void) | undefined;
    mockedSubmitRow
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce({ isDuplicate: false });

    render(
      <BulkAddClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={[]}
        defaultPersonId="person-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Adicionar linha" }));
    for (const button of screen.getAllByRole("button", { name: "Editar valor" })) {
      fireEvent.click(button);
    }

    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));
    await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(1));

    rejectFirst?.(new Error("Falha na primeira linha"));
    await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Falha na primeira linha")).toBeVisible();
  });

  it("does not submit successful rows again on retry", async () => {
    mockedSubmitRow.mockResolvedValue({ isDuplicate: false });

    render(
      <BulkAddClient
        people={[{ id: "person-1", name: "Felipe" }]}
        categories={[]}
        creditCards={[]}
        defaultPersonId="person-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));
    await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Adicionar linha" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Editar valor" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Enviar tudo" }));

    await waitFor(() => expect(mockedSubmitRow).toHaveBeenCalledTimes(2));
  });
});
