/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { BulkAddRow } from "@/components/transactions/bulk-add/BulkAddRow";
import type { BulkRow } from "@/components/transactions/bulk-add/types";

jest.mock("@/components/ui/category-combobox", () => ({
  CategoryCombobox: ({
    disabled,
    onChange,
  }: {
    disabled?: boolean;
    onChange: (v: string) => void;
  }) => (
    <button type="button" disabled={disabled} onClick={() => onChange("category-1")}>
      Categoria
    </button>
  ),
}));

jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: ({
    disabled,
    onChange,
  }: {
    disabled?: boolean;
    onChange: (v: string) => void;
  }) => (
    <input
      aria-label="Valor"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ disabled, onChange }: { disabled?: boolean; onChange: (v: string) => void }) => (
    <button
      type="button"
      aria-label="Data"
      disabled={disabled}
      onClick={() => onChange("2026-08-18")}
    >
      Data
    </button>
  ),
}));

const baseRow: BulkRow = {
  clientId: "row-1",
  type: "expense",
  personId: "person-1",
  amount: "10,00",
  date: "2026-08-17",
  paymentMethod: "PIX",
  source: "SALARY",
  categoryId: "",
  description: "Mercado",
  status: "pending",
};

function renderRow(row: BulkRow, disabled = false) {
  const onChange = jest.fn();
  const onRemove = jest.fn();
  render(
    <BulkAddRow
      row={row}
      people={[{ id: "person-1", name: "Felipe" }]}
      categories={[]}
      onChange={onChange}
      onRemove={onRemove}
      disabled={disabled}
    />,
  );
  return { onChange, onRemove };
}

describe("BulkAddRow", () => {
  it("locks every editable field after the row succeeds", () => {
    renderRow({ ...baseRow, status: "success" });

    expect(screen.getByLabelText("Tipo")).toBeDisabled();
    expect(screen.getByLabelText("Pessoa")).toBeDisabled();
    expect(screen.getByLabelText("Valor")).toBeDisabled();
    expect(screen.getByLabelText("Data")).toBeDisabled();
    expect(screen.getByLabelText("Descrição")).toBeDisabled();
  });

  it("shows the row error as visible text", () => {
    renderRow({ ...baseRow, status: "error", error: "Informe um valor válido." });

    expect(screen.getByText("Informe um valor válido.")).toBeVisible();
  });

  it("disables editing and removal while the batch is submitting", () => {
    renderRow(baseRow, true);

    expect(screen.getByLabelText("Valor")).toBeDisabled();
    expect(screen.getByLabelText("Data")).toBeDisabled();
    expect(screen.getByLabelText("Remover linha")).toBeDisabled();
  });

  it("forwards edits from every common and expense field", () => {
    const { onChange, onRemove } = renderRow(baseRow);

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Pessoa"), { target: { value: "person-1" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "20,00" } });
    fireEvent.click(screen.getByLabelText("Data"));
    fireEvent.click(screen.getByRole("button", { name: "Categoria" }));
    fireEvent.change(screen.getByLabelText("Forma de pagamento"), { target: { value: "PIX" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Farmácia" } });
    fireEvent.click(screen.getByLabelText("Remover linha"));

    expect(onChange).toHaveBeenCalledTimes(7);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("forwards income source edits", () => {
    const { onChange } = renderRow({ ...baseRow, type: "income" });

    fireEvent.change(screen.getByLabelText("Fonte"), { target: { value: "FREELANCE" } });

    expect(onChange).toHaveBeenCalledWith({ source: "FREELANCE" });
  });

  it("has no installment type: card purchases live in their own section", () => {
    renderRow(baseRow);

    const options = Array.from(screen.getByLabelText("Tipo").querySelectorAll("option"));
    expect(options.map((o) => o.textContent)).toEqual(["Despesa", "Receita"]);
    expect(screen.queryByLabelText("Cartão de crédito")).not.toBeInTheDocument();
  });

  it("shows loading and duplicate-success states", () => {
    const { rerender } = render(
      <BulkAddRow
        row={{ ...baseRow, status: "loading" }}
        people={[]}
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(
      <BulkAddRow
        row={{ ...baseRow, status: "success", isDuplicate: true }}
        people={[]}
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Possível duplicata")).toBeVisible();
  });
});
