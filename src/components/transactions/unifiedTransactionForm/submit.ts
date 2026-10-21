import { parseCurrencyBR } from "@/lib/utils";
import type { FormType } from "./fields";

export type EditMode = {
  transactionId?: string;
  purchaseId?: string;
};

export type InitialValues = {
  type: "expense" | "income" | "credit";
  personId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  source: string;
  creditCardId: string;
  categoryId: string;
  description: string;
};

export type SubmitFields = {
  personId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  source: string;
  creditCardId: string;
  categoryId: string;
  description: string;
  numberOfInstallments: string;
  billingMonth?: string;
  splits?: { personId: string; amount: number }[];
};

export type SubmitTarget = { url: string; method: string; body: Record<string, unknown> };

export function resolveEditTarget(
  editMode: EditMode,
  type: FormType,
  fields: SubmitFields,
): SubmitTarget | { error: string } {
  if (editMode.transactionId) {
    if (type === "expense") {
      return {
        url: `/api/expenses/${editMode.transactionId}`,
        method: "PUT",
        body: {
          personId: fields.personId,
          amount: parseCurrencyBR(fields.amount),
          date: fields.date,
          paymentMethod: fields.paymentMethod,
          categoryId: fields.categoryId || null,
          description: fields.description,
        },
      };
    }
    return {
      url: `/api/incomes/${editMode.transactionId}`,
      method: "PUT",
      body: {
        personId: fields.personId,
        amount: parseCurrencyBR(fields.amount),
        date: fields.date,
        source: fields.source,
        categoryId: fields.categoryId || null,
        description: fields.description,
      },
    };
  }
  if (editMode.purchaseId) {
    return {
      url: `/api/credit-card-purchases/${editMode.purchaseId}`,
      method: "PUT",
      body: {
        description: fields.description,
        totalAmount: parseCurrencyBR(fields.amount),
        purchaseDate: fields.date,
        categoryId: fields.categoryId || null,
        creditCardId: fields.creditCardId,
      },
    };
  }
  return { error: "ID da compra não encontrado." };
}

export function resolveCreateTarget(type: FormType, fields: SubmitFields): SubmitTarget {
  if (type === "expense") {
    return {
      url: "/api/expenses",
      method: "POST",
      body: {
        personId: fields.personId,
        amount: parseCurrencyBR(fields.amount),
        date: fields.date,
        paymentMethod: fields.paymentMethod,
        categoryId: fields.categoryId || null,
        description: fields.description,
      },
    };
  }
  if (type === "income") {
    return {
      url: "/api/incomes",
      method: "POST",
      body: {
        personId: fields.personId,
        amount: parseCurrencyBR(fields.amount),
        date: fields.date,
        source: fields.source,
        categoryId: fields.categoryId || null,
        description: fields.description,
      },
    };
  }
  return {
    url: "/api/installments",
    method: "POST",
    body: {
      ...(fields.splits ? { splits: fields.splits } : { personId: fields.personId }),
      creditCardId: fields.creditCardId,
      totalAmount: parseCurrencyBR(fields.amount),
      numberOfInstallments: parseInt(fields.numberOfInstallments, 10),
      purchaseDate: fields.date,
      ...(fields.billingMonth ? { billingMonth: fields.billingMonth } : {}),
      categoryId: fields.categoryId || null,
      description: fields.description,
    },
  };
}

export function resolveSubmitTarget(
  editMode: EditMode | undefined,
  type: FormType,
  fields: SubmitFields,
): SubmitTarget | { error: string } {
  if (editMode) return resolveEditTarget(editMode, type, fields);
  return resolveCreateTarget(type, fields);
}

export function computeDuplicateCheckValues(
  type: FormType,
  amount: string,
  date: string,
  paymentMethod: string,
  creditCardId: string,
) {
  const dupType: "EXPENSE" | "INCOME" = type === "income" ? "INCOME" : "EXPENSE";
  return {
    dupType,
    transactionAmount: type !== "credit" && amount ? parseCurrencyBR(amount) : null,
    ...computeCreditCrossDuplicateValues(type, amount, date, paymentMethod, creditCardId),
  };
}

export function computeCreditCrossDuplicateValues(
  type: FormType,
  amount: string,
  date: string,
  paymentMethod: string,
  creditCardId: string,
) {
  return {
    creditAmount: type === "credit" && amount ? parseCurrencyBR(amount) : null,
    creditDate: type === "credit" ? date : null,
    creditCardIdArg: type === "credit" ? creditCardId : null,
    crossAmount: type === "expense" && amount ? parseCurrencyBR(amount) : null,
    crossDate: type === "expense" ? date : null,
    crossPaymentMethod: type === "expense" ? paymentMethod : null,
  };
}

export function getInitialFormState(
  initialValues: InitialValues | undefined,
  defaultPersonId: string,
  today: string,
) {
  return {
    type: initialValues?.type ?? "expense",
    personId: initialValues?.personId ?? defaultPersonId,
    amount: initialValues?.amount ?? "",
    date: initialValues?.date ?? today,
    description: initialValues?.description ?? "",
    categoryId: initialValues?.categoryId ?? "",
    paymentMethod: initialValues?.paymentMethod ?? "CASH",
    source: initialValues?.source ?? "SALARY",
    creditCardId: initialValues?.creditCardId ?? "",
  };
}

export function deriveDuplicateMatch<A, B, C>(
  duplicateTransaction: A | null,
  duplicateCreditCard: B | null,
  duplicateCrossEntity: C | null,
) {
  return {
    duplicateMatch: duplicateTransaction ?? duplicateCreditCard ?? duplicateCrossEntity,
    isCrossType: !duplicateTransaction && !!duplicateCrossEntity,
  };
}

export function getFieldLabels(type: FormType) {
  return {
    amountLabel: type === "credit" ? "Valor total" : "Valor",
    dateLabel: type === "credit" ? "Data da compra" : "Data",
  };
}

export function getSubmitButtonLabel(loading: boolean, isEditMode: boolean, typeLabel: string) {
  if (loading) return isEditMode ? "Salvando…" : "Adicionando…";
  return isEditMode ? "Salvar alterações" : `Adicionar ${typeLabel}`;
}
