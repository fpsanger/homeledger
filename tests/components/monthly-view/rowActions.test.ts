import { buildRowActions } from "../../../src/components/monthly-view/rowActions";
import type { Transaction } from "../../../src/components/monthly-view/transactionTableFilters";

const base: Transaction = {
  id: "tx-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: "2026-04-10T00:00:00.000Z",
  description: "Aluguel",
  paymentMethod: "PIX",
};

const recurring: Transaction = { ...base, id: "rule-1", isRecurring: true };

function build(t: Transaction, handlers: { onEdit?: jest.Mock; onEditRecurring?: jest.Mock } = {}) {
  const handleDelete = jest.fn();
  const items = buildRowActions({ t, deletingId: null, handleDelete, ...handlers });
  return { items, handleDelete };
}

describe("buildRowActions", () => {
  it("routes a plain row to onEdit", () => {
    const onEdit = jest.fn();
    const onEditRecurring = jest.fn();
    const { items } = build(base, { onEdit, onEditRecurring });

    items[0].onClick();

    expect(onEdit).toHaveBeenCalledWith(base);
    expect(onEditRecurring).not.toHaveBeenCalled();
  });

  it("routes a recurring row to onEditRecurring", () => {
    const onEdit = jest.fn();
    const onEditRecurring = jest.fn();
    const { items } = build(recurring, { onEdit, onEditRecurring });

    expect(items[0].label).toBe("Editar");
    items[0].onClick();

    expect(onEditRecurring).toHaveBeenCalledWith(recurring);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("offers Editar on a recurring row even without onEdit", () => {
    const { items } = build(recurring, { onEditRecurring: jest.fn() });

    expect(items.map((i) => i.label)).toEqual(["Editar", "Excluir"]);
  });

  it("omits Editar when no matching handler is supplied", () => {
    expect(build(recurring).items.map((i) => i.label)).toEqual(["Excluir"]);
    expect(build(base).items.map((i) => i.label)).toEqual(["Excluir"]);
  });

  it("deletes through the recurring route for a recurring row", () => {
    const { items, handleDelete } = build(recurring, { onEditRecurring: jest.fn() });

    items[items.length - 1].onClick();

    expect(handleDelete).toHaveBeenCalledWith("rule-1", true);
  });

  it("marks the delete action as destructive", () => {
    const { items } = build(base, { onEdit: jest.fn() });

    expect(items[items.length - 1].variant).toBe("destructive");
  });

  it("shows delete progress for the row being deleted", () => {
    const handleDelete = jest.fn();
    const items = buildRowActions({ t: base, deletingId: "tx-1", handleDelete });

    expect(items[0].label).toBe("Excluindo...");
  });
});
