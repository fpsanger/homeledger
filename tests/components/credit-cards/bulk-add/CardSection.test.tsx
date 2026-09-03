/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { CardSection } from "@/components/credit-cards/bulk-add/CardSection";
import type { PurchaseRow } from "@/components/credit-cards/bulk-add/types";

jest.mock("@/components/credit-cards/bulk-add/PurchaseRowForm", () => ({
  PurchaseRowForm: ({
    row,
    onChange,
    onRemove,
    onDuplicate,
    disabled,
  }: {
    row: PurchaseRow;
    onChange: (patch: Partial<PurchaseRow>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="row" data-row-id={row.rowId}>
      <button type="button" onClick={() => onChange({ amount: "10,00" })} disabled={disabled}>
        Editar valor
      </button>
      <button type="button" onClick={onRemove} disabled={disabled}>
        Remover compra
      </button>
      <button type="button" onClick={onDuplicate} disabled={disabled}>
        Copiar compra
      </button>
    </div>
  ),
}));

const card = { id: "card-1", name: "Nubank" };

function row(patch: Partial<PurchaseRow> = {}): PurchaseRow {
  return {
    rowId: "row-1",
    amount: "",
    date: "2026-08-17",
    categoryId: "",
    description: "",
    numberOfInstallments: "2",
    status: "pending",
    ...patch,
  };
}

describe("CardSection", () => {
  it("renders the card name and its rows", () => {
    render(
      <CardSection
        card={card}
        rows={[row(), row({ rowId: "row-2" })]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
      />,
    );

    expect(screen.getByText("Nubank")).toBeVisible();
    expect(screen.getAllByTestId("row")).toHaveLength(2);
  });

  it("adds a row when 'Adicionar compra' is clicked", () => {
    const onAddRow = jest.fn();
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={onAddRow}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Adicionar compra" }));
    expect(onAddRow).toHaveBeenCalledTimes(1);
  });

  it("forwards row edits and removal with the row id", () => {
    const onEditRow = jest.fn();
    const onRemoveRow = jest.fn();
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={onEditRow}
        onRemoveRow={onRemoveRow}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar valor" }));
    fireEvent.click(screen.getByRole("button", { name: "Remover compra" }));

    expect(onEditRow).toHaveBeenCalledWith("row-1", { amount: "10,00" });
    expect(onRemoveRow).toHaveBeenCalledWith("row-1");
  });

  it("forwards a row duplication with the row id", () => {
    const onDuplicateRow = jest.fn();
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={onDuplicateRow}
        onRemoveSection={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copiar compra" }));
    expect(onDuplicateRow).toHaveBeenCalledWith("row-1");
  });

  it("removes the section when its remove button is clicked", () => {
    const onRemoveSection = jest.fn();
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={onRemoveSection}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remover cartão Nubank" }));
    expect(onRemoveSection).toHaveBeenCalledTimes(1);
  });

  it("locks the section removal once a row has succeeded", () => {
    render(
      <CardSection
        card={card}
        rows={[row({ status: "success" })]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Remover cartão Nubank" })).toBeDisabled();
  });

  it("renders a Pessoa select inside the card box and forwards changes", () => {
    const onPersonChange = jest.fn();
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[{ id: "person-1", name: "Ana" }]}
        personId=""
        onPersonChange={onPersonChange}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Pessoa" }), {
      target: { value: "person-1" },
    });
    expect(onPersonChange).toHaveBeenCalledWith("person-1");
  });

  it("disables adding a row while submitting", () => {
    render(
      <CardSection
        card={card}
        rows={[row()]}
        categories={[]}
        people={[]}
        personId=""
        onPersonChange={jest.fn()}
        onAddRow={jest.fn()}
        onEditRow={jest.fn()}
        onRemoveRow={jest.fn()}
        onDuplicateRow={jest.fn()}
        onRemoveSection={jest.fn()}
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: "Adicionar compra" })).toBeDisabled();
  });
});
