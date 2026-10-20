import type { Transaction } from "./transactionTableFilters";

type RowActionsInput = {
  t: Transaction;
  deletingId: string | null;
  handleDelete: (id: string, isRecurring?: boolean) => void;
  onEdit?: (t: Transaction) => void;
  onEditRecurring?: (t: Transaction) => void;
};

/**
 * Builds the dropdown items for one transaction row. Shared by the desktop and mobile tables so
 * the two never drift apart.
 *
 * A recurring row is a projection of a rule, not a stored transaction, so it routes to
 * `onEditRecurring` (which edits the rule from a chosen month onward) instead of `onEdit`.
 */
export function buildRowActions({
  t,
  deletingId,
  handleDelete,
  onEdit,
  onEditRecurring,
}: RowActionsInput) {
  const edit = t.isRecurring ? onEditRecurring : onEdit;
  return [
    ...(edit ? [{ label: "Editar", onClick: () => edit(t) }] : []),
    {
      label: deletingId === t.id ? "Excluindo..." : "Excluir",
      onClick: () => handleDelete(t.id, t.isRecurring),
      variant: "destructive" as const,
    },
  ];
}
