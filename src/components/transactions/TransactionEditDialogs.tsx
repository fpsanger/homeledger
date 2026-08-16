"use client";

import { Dialog } from "@/components/ui/dialog";
import { formatAmountBR } from "@/lib/utils";
import { EditInstallmentForm } from "./EditInstallmentForm";
import type { Category, CreditCard, Installment, Person, Transaction } from "./types";
import { UnifiedTransactionForm } from "./UnifiedTransactionForm";

function toDateInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function mapTransactionToInitialValues(transaction: Transaction) {
  return {
    type:
      transaction.type === "INCOME"
        ? ("income" as const)
        : transaction.type === "INVESTMENT"
          ? ("expense" as const)
          : ("expense" as const),
    personId: transaction.personId,
    amount: formatAmountBR(transaction.amount),
    date: toDateInput(transaction.date),
    paymentMethod: transaction.paymentMethod ?? "CASH",
    source: transaction.source ?? "SALARY",
    creditCardId: "",
    categoryId: transaction.categoryId ?? "",
    description: transaction.description,
  };
}

function mapPurchaseToInitialValues(purchase: Installment) {
  const totalAmount =
    purchase.purchaseTotalAmount ?? purchase.amount * (purchase.numberOfInstallments ?? 1);
  const purchaseDate = purchase.purchaseDate
    ? toDateInput(purchase.purchaseDate)
    : toDateInput(new Date(purchase.dueYear, purchase.dueMonth - 1, 1));
  return {
    type: "credit" as const,
    personId: purchase.personId ?? "",
    amount: formatAmountBR(totalAmount),
    date: purchaseDate,
    paymentMethod: "CASH",
    source: "SALARY",
    creditCardId: purchase.creditCardId ?? "",
    categoryId: purchase.categoryId ?? "",
    description: purchase.purchaseDescription ?? "",
  };
}

export function EditTransactionDialog({
  transaction,
  people,
  categories,
  creditCards,
  onClose,
}: {
  transaction: Transaction | null;
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  onClose: () => void;
}) {
  return (
    <Dialog open={transaction !== null} onClose={onClose} title="Editar Transação">
      {transaction && (
        <UnifiedTransactionForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          editMode={{ transactionId: transaction.id }}
          initialValues={mapTransactionToInitialValues(transaction)}
          onSuccess={onClose}
        />
      )}
    </Dialog>
  );
}

export function EditInstallmentDialog({
  installment,
  people,
  creditCards,
  onClose,
}: {
  installment: Installment | null;
  people: Person[];
  creditCards: CreditCard[];
  onClose: () => void;
}) {
  return (
    <Dialog open={installment !== null} onClose={onClose} title="Editar Parcela">
      {installment && (
        <EditInstallmentForm
          installment={installment}
          people={people}
          creditCards={creditCards}
          onSuccess={onClose}
        />
      )}
    </Dialog>
  );
}

export function EditPurchaseDialog({
  purchase,
  people,
  categories,
  creditCards,
  onClose,
}: {
  purchase: Installment | null;
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  onClose: () => void;
}) {
  return (
    <Dialog open={purchase !== null} onClose={onClose} title="Editar Compra">
      {purchase && (
        <UnifiedTransactionForm
          people={people}
          categories={categories}
          creditCards={creditCards}
          editMode={{ purchaseId: purchase.creditCardPurchaseId }}
          initialValues={mapPurchaseToInitialValues(purchase)}
          onSuccess={onClose}
        />
      )}
    </Dialog>
  );
}
