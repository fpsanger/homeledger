/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { PurchaseRowForm } from "@/components/credit-cards/bulk-add/PurchaseRowForm";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";

jest.mock("@/components/ui/month-picker", () => ({
  MonthPicker: ({
    id,
    ariaLabel,
    value,
    onChange,
    clearLabel,
    disabled,
  }: {
    id?: string;
    ariaLabel?: string;
    value: string;
    onChange: (value: string) => void;
    clearLabel?: string;
    disabled?: boolean;
  }) => (
    <input
      id={id}
      aria-label={ariaLabel}
      value={value}
      data-clear-label={clearLabel}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

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
    value,
    "aria-label": ariaLabel,
  }: {
    disabled?: boolean;
    onChange: (v: string) => void;
    value: string;
    "aria-label"?: string;
  }) => (
    <input
      aria-label={ariaLabel ?? "Valor"}
      value={value}
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
  installmentAmount: "5,00",
  lastEdited: "total",
  date: "2026-08-17",
  categoryId: "",
  description: "Mercado",
  numberOfInstallments: "2",
  status: "pending",
};

function renderRow(row: PurchaseRow, disabled = false) {
  const onChange = jest.fn();
  const onRemove = jest.fn();
  const onDuplicate = jest.fn();
  render(
    <PurchaseRowForm
      row={row}
      sectionBillingMonth="2026-09"
      categories={[]}
      onChange={onChange}
      onRemove={onRemove}
      onDuplicate={onDuplicate}
      disabled={disabled}
    />,
  );
  return { onChange, onRemove, onDuplicate };
}

describe("PurchaseRowForm", () => {
  it("locks every editable field after the row succeeds", () => {
    renderRow({ ...baseRow, status: "success" });

    expect(screen.getByLabelText("Valor total")).toBeDisabled();
    expect(screen.getByLabelText("Valor da parcela")).toBeDisabled();
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

    expect(screen.getByLabelText("Valor total")).toBeDisabled();
    expect(screen.getByLabelText("Remover compra")).toBeDisabled();
  });

  it("forwards edits from every field", () => {
    const { onChange, onRemove } = renderRow(baseRow);

    fireEvent.change(screen.getByLabelText("Valor total"), { target: { value: "20,00" } });
    fireEvent.click(screen.getByLabelText("Data"));
    fireEvent.click(screen.getByRole("button", { name: "Categoria" }));
    fireEvent.change(screen.getByLabelText("Número de parcelas"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Farmácia" } });
    fireEvent.click(screen.getByLabelText("Remover compra"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ amount: "20,00" }));
    expect(onChange).toHaveBeenCalledWith({ date: "2026-08-18" });
    expect(onChange).toHaveBeenCalledWith({ categoryId: "category-1" });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ numberOfInstallments: "6" }));
    expect(onChange).toHaveBeenCalledWith({ description: "Farmácia" });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("offers a single-installment option", () => {
    const { onChange } = renderRow(baseRow);
    const select = screen.getByLabelText("Número de parcelas");

    expect(within(select).getByRole("option", { name: "1x" })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ numberOfInstallments: "1" }));
  });

  it("links the total and the installment amount", () => {
    const { onChange } = renderRow({
      ...baseRow,
      amount: "",
      installmentAmount: "",
      numberOfInstallments: "4",
    });

    fireEvent.change(screen.getByLabelText("Valor total"), { target: { value: "100,00" } });
    expect(onChange).toHaveBeenLastCalledWith({
      amount: "100,00",
      installmentAmount: "25,00",
      numberOfInstallments: "4",
      lastEdited: "total",
    });

    fireEvent.change(screen.getByLabelText("Valor da parcela"), { target: { value: "30,00" } });
    expect(onChange).toHaveBeenLastCalledWith({
      amount: "120,00",
      installmentAmount: "30,00",
      numberOfInstallments: "4",
      lastEdited: "installment",
    });
  });

  it("moves the amount that was not typed last when the count changes", () => {
    const { onChange } = renderRow({
      ...baseRow,
      amount: "100,00",
      installmentAmount: "50,00",
      lastEdited: "installment",
    });

    fireEvent.change(screen.getByLabelText("Número de parcelas"), { target: { value: "5" } });

    expect(onChange).toHaveBeenCalledWith({
      amount: "250,00",
      installmentAmount: "50,00",
      numberOfInstallments: "5",
      lastEdited: "installment",
    });
  });

  it("shows one Valor field for a single installment, marked à vista", () => {
    renderRow({ ...baseRow, numberOfInstallments: "1", installmentAmount: "" });

    expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor total")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor da parcela")).not.toBeInTheDocument();
    expect(screen.getByText("à vista")).toBeVisible();
  });

  it("states how the purchase splits, including the uneven last installment", () => {
    renderRow({
      ...baseRow,
      amount: "100,00",
      installmentAmount: "33,33",
      numberOfInstallments: "3",
    });

    expect(screen.getByText(/^3× R\$\s33,33 · última R\$\s33,34$/)).toBeVisible();
  });

  it("has no split note for a single installment", () => {
    renderRow({ ...baseRow, numberOfInstallments: "1" });

    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it("copies the row through the button next to the trash icon", () => {
    const { onDuplicate } = renderRow(baseRow);

    fireEvent.click(screen.getByLabelText("Copiar compra"));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it("still allows copying a row that already succeeded", () => {
    renderRow({ ...baseRow, status: "success" });

    expect(screen.getByLabelText("Copiar compra")).toBeEnabled();
    expect(screen.getByLabelText("Remover compra")).toBeDisabled();
  });

  it("disables copying while the batch is submitting", () => {
    renderRow(baseRow, true);

    expect(screen.getByLabelText("Copiar compra")).toBeDisabled();
  });

  it("shows loading and duplicate-success states", () => {
    const { rerender } = render(
      <PurchaseRowForm
        row={{ ...baseRow, status: "loading" }}
        sectionBillingMonth=""
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onDuplicate={jest.fn()}
      />,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(
      <PurchaseRowForm
        row={{ ...baseRow, status: "success", isDuplicate: true }}
        sectionBillingMonth=""
        categories={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onDuplicate={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Possível duplicata")).toBeVisible();
  });

  it("starts a per-row bill from the section's bill", () => {
    const { onChange } = renderRow(baseRow);

    fireEvent.click(screen.getByLabelText("Outra fatura"));

    expect(onChange).toHaveBeenCalledWith({ billingMonth: "2026-09" });
  });

  it("edits and clears a per-row bill", () => {
    const { onChange } = renderRow({ ...baseRow, billingMonth: "2026-10" });

    expect(screen.queryByLabelText("Outra fatura")).not.toBeInTheDocument();
    const input = screen.getByLabelText("Fatura desta compra");
    expect(input).toHaveValue("2026-10");

    fireEvent.change(input, { target: { value: "2026-11" } });
    expect(onChange).toHaveBeenCalledWith({ billingMonth: "2026-11" });

    fireEvent.click(screen.getByLabelText("Usar fatura do cartão"));
    expect(onChange).toHaveBeenCalledWith({ billingMonth: undefined });
  });
});
