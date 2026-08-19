/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { PurchaseRowForm } from "@/components/credit-cards/bulk-add/PurchaseRowForm";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";

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

const baseRow: PurchaseRow = {
  rowId: "row-1",
  amount: "10,00",
  date: "2026-08-17",
  categoryId: "",
  description: "Mercado",
  numberOfInstallments: "2",
  status: "pending",
};

function renderRow(row: PurchaseRow, disabled = false) {
  const onChange = jest.fn();
  const onRemove = jest.fn();
  render(
    <PurchaseRowForm
      row={row}
      categories={[]}
      onChange={onChange}
      onRemove={onRemove}
      disabled={disabled}
    />,
  );
  return { onChange, onRemove };
}

describe("PurchaseRowForm", () => {
  it("locks every editable field after the row succeeds", () => {
    renderRow({ ...baseRow, status: "success" });

    expect(screen.getByLabelText("Valor")).toBeDisabled();
    expect(screen.getByLabelText("Data")).toBeDisabled();
    expect(screen.getByLabelText("Número de parcelas")).toBeDisabled();
    expect(screen.getByLabelText("Descrição")).toBeDisabled();
  });

  it("shows the row error as visible text", () => {
    renderRow({ ...baseRow, status: "error", error: "Informe um valor válido." });

    expect(screen.getByText("Informe um valor válido.")).toBeVisible();
  });

  it("disables editing and removal while the batch is submitting", () => {
    renderRow(baseRow, true);

    expect(screen.getByLabelText("Valor")).toBeDisabled();
    expect(screen.getByLabelText("Remover compra")).toBeDisabled();
  });

  it("forwards edits from every field", () => {
    const { onChange, onRemove } = renderRow(baseRow);

    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "20,00" } });
    fireEvent.click(screen.getByLabelText("Data"));
    fireEvent.click(screen.getByRole("button", { name: "Categoria" }));
    fireEvent.change(screen.getByLabelText("Número de parcelas"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Farmácia" } });
    fireEvent.click(screen.getByLabelText("Remover compra"));

    expect(onChange).toHaveBeenCalledWith({ amount: "20,00" });
    expect(onChange).toHaveBeenCalledWith({ date: "2026-08-18" });
    expect(onChange).toHaveBeenCalledWith({ categoryId: "category-1" });
    expect(onChange).toHaveBeenCalledWith({ numberOfInstallments: "6" });
    expect(onChange).toHaveBeenCalledWith({ description: "Farmácia" });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("shows loading and duplicate-success states", () => {
    const { rerender } = render(
      <PurchaseRowForm
        row={{ ...baseRow, status: "loading" }}
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(
      <PurchaseRowForm
        row={{ ...baseRow, status: "success", isDuplicate: true }}
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Possível duplicata")).toBeVisible();
  });
});
