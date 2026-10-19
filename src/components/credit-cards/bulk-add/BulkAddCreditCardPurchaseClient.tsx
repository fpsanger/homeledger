"use client";

import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Category, Person } from "../../transactions/types";
import { CardCombobox } from "./CardCombobox";
import { CardSection } from "./CardSection";
import { submitPurchase } from "./submitPurchase";
import {
  type ClosureType,
  createEmptyRow,
  defaultSectionBillingMonth,
  duplicateRow,
  type PurchaseRow,
  resolveRowBillingMonth,
  validateBillingMonth,
  validatePersonId,
  validateRow,
} from "./types";

type CreditCard = { id: string; name: string; closureType: ClosureType };
type Section = { cardId: string; billingMonth: string; rows: PurchaseRow[] };
type SubmitItem = {
  cardId: string;
  closureType: ClosureType;
  billingMonth: string;
  row: PurchaseRow;
};
type SectionsState = { sections: Section[]; pendingCardId: string };

type Props = {
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  defaultPersonId?: string;
};

export function BulkAddCreditCardPurchaseClient({
  people,
  categories,
  creditCards,
  defaultPersonId = "",
}: Props) {
  const form = useBulkAddForm(creditCards, defaultPersonId);

  return (
    <div className="flex flex-col gap-4">
      <CardPicker
        availableCards={form.availableCards}
        pendingCardId={form.pendingCardId}
        onPendingChange={form.setPendingCardId}
        onAdd={form.addCardSection}
        disabled={form.submitting}
      />
      <SectionsList
        sections={form.sections}
        creditCards={creditCards}
        categories={categories}
        people={people}
        personId={form.personId}
        onPersonChange={form.setPersonId}
        submitting={form.submitting}
        onAddRow={form.addRow}
        onEditRow={form.editRow}
        onRemoveRow={form.removeRow}
        onDuplicateRow={form.duplicateRowInSection}
        onRemoveSection={form.removeCardSection}
        onBillingMonthChange={form.setSectionBillingMonth}
      />
      {form.formError && (
        <p className="text-sm text-destructive" role="alert">
          {form.formError}
        </p>
      )}
      <SubmitFooter
        progress={form.progress}
        submitting={form.submitting}
        onSubmit={form.handleSubmitAll}
      />
    </div>
  );
}

type SectionsAction =
  | { type: "SET_PENDING_CARD"; cardId: string }
  | { type: "ADD_SECTION"; today: string; billingMonth: string }
  | { type: "SET_BILLING_MONTH"; cardId: string; billingMonth: string }
  | { type: "REMOVE_SECTION"; cardId: string }
  | { type: "ADD_ROW"; cardId: string; today: string }
  | { type: "REMOVE_ROW"; cardId: string; rowId: string }
  | { type: "DUPLICATE_ROW"; cardId: string; rowId: string; today: string }
  | { type: "UPDATE_ROW"; cardId: string; rowId: string; patch: Partial<PurchaseRow> };

function sectionsReducer(state: SectionsState, action: SectionsAction): SectionsState {
  switch (action.type) {
    case "SET_PENDING_CARD":
      return { ...state, pendingCardId: action.cardId };
    case "ADD_SECTION":
      if (!state.pendingCardId) return state;
      return {
        sections: [
          ...state.sections,
          {
            cardId: state.pendingCardId,
            billingMonth: action.billingMonth,
            rows: [createEmptyRow(action.today)],
          },
        ],
        pendingCardId: "",
      };
    case "SET_BILLING_MONTH":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.cardId === action.cardId
            ? { ...s, billingMonth: action.billingMonth, rows: s.rows.map(clearRowError) }
            : s,
        ),
      };
    case "REMOVE_SECTION":
      return { ...state, sections: state.sections.filter((s) => s.cardId !== action.cardId) };
    case "ADD_ROW":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.cardId === action.cardId
            ? { ...s, rows: [...s.rows, createEmptyRow(action.today)] }
            : s,
        ),
      };
    case "REMOVE_ROW":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.cardId === action.cardId
            ? { ...s, rows: s.rows.filter((r) => r.rowId !== action.rowId) }
            : s,
        ),
      };
    case "DUPLICATE_ROW":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.cardId === action.cardId ? { ...s, rows: withCopyAfter(s.rows, action) } : s,
        ),
      };
    case "UPDATE_ROW":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.cardId === action.cardId
            ? {
                ...s,
                rows: s.rows.map((r) => (r.rowId === action.rowId ? { ...r, ...action.patch } : r)),
              }
            : s,
        ),
      };
    default:
      return state;
  }
}

function clearRowError(row: PurchaseRow): PurchaseRow {
  return row.status === "error" ? { ...row, status: "pending", error: undefined } : row;
}

function withCopyAfter(
  rows: PurchaseRow[],
  action: { rowId: string; today: string },
): PurchaseRow[] {
  const index = rows.findIndex((r) => r.rowId === action.rowId);
  if (index === -1) return rows;
  const copy = duplicateRow(rows[index], action.today);
  return [...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)];
}

function useBulkAddForm(creditCards: CreditCard[], defaultPersonId: string) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [personId, setPersonId] = useState(defaultPersonId);
  const [{ sections, pendingCardId }, dispatch] = useReducer(sectionsReducer, {
    sections: [],
    pendingCardId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const availableCards = creditCards.filter((c) => !sections.some((s) => s.cardId === c.id));

  function setPendingCardId(cardId: string) {
    dispatch({ type: "SET_PENDING_CARD", cardId });
  }
  function addCardSection() {
    const card = creditCards.find((c) => c.id === pendingCardId);
    if (submitting || !card) return;
    const billingMonth = defaultSectionBillingMonth(card.closureType, today);
    dispatch({ type: "ADD_SECTION", today, billingMonth });
  }
  function setSectionBillingMonth(cardId: string, billingMonth: string) {
    if (!submitting) dispatch({ type: "SET_BILLING_MONTH", cardId, billingMonth });
  }
  function removeCardSection(cardId: string) {
    if (!submitting) dispatch({ type: "REMOVE_SECTION", cardId });
  }
  function addRow(cardId: string) {
    if (!submitting) dispatch({ type: "ADD_ROW", cardId, today });
  }
  function removeRow(cardId: string, rowId: string) {
    if (!submitting) dispatch({ type: "REMOVE_ROW", cardId, rowId });
  }
  function duplicateRowInSection(cardId: string, rowId: string) {
    if (!submitting) dispatch({ type: "DUPLICATE_ROW", cardId, rowId, today });
  }
  function updateRow(cardId: string, rowId: string, patch: Partial<PurchaseRow>) {
    dispatch({ type: "UPDATE_ROW", cardId, rowId, patch });
  }
  function editRow(cardId: string, rowId: string, patch: Partial<PurchaseRow>) {
    if (!submitting) {
      updateRow(cardId, rowId, {
        ...patch,
        status: "pending",
        error: undefined,
        isDuplicate: undefined,
      });
    }
  }

  async function handleSubmitAll() {
    if (submitting) return;

    const toSubmit = collectSubmitItems(sections, creditCards);
    if (toSubmit.length === 0) {
      toast.error("Nenhuma compra para enviar.");
      return;
    }

    const personError = validatePersonId(personId);
    if (personError) {
      setFormError(personError);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const { succeeded, failed } = await submitToRows(toSubmit, personId, updateRow, setProgress);
    setProgress(null);
    setSubmitting(false);

    reportSubmission(succeeded, failed, {
      refresh: () => router.refresh(),
      goToTransactions: () => router.push("/transactions"),
    });
  }

  return {
    personId,
    setPersonId,
    sections,
    pendingCardId,
    setPendingCardId,
    formError,
    submitting,
    progress,
    availableCards,
    addCardSection,
    setSectionBillingMonth,
    removeCardSection,
    addRow,
    removeRow,
    duplicateRowInSection,
    editRow,
    handleSubmitAll,
  };
}

function CardPicker({
  availableCards,
  pendingCardId,
  onPendingChange,
  onAdd,
  disabled,
}: {
  availableCards: CreditCard[];
  pendingCardId: string;
  onPendingChange: (id: string) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 max-w-xs">
        <CardCombobox
          cards={availableCards}
          value={pendingCardId}
          onChange={onPendingChange}
          disabled={disabled}
        />
      </div>
      <Button type="button" variant="outline" onClick={onAdd} disabled={disabled || !pendingCardId}>
        Adicionar cartão
      </Button>
    </div>
  );
}

function SectionsList({
  sections,
  creditCards,
  categories,
  people,
  personId,
  onPersonChange,
  submitting,
  onAddRow,
  onEditRow,
  onRemoveRow,
  onDuplicateRow,
  onRemoveSection,
  onBillingMonthChange,
}: {
  sections: Section[];
  creditCards: CreditCard[];
  categories: Category[];
  people: Person[];
  personId: string;
  onPersonChange: (id: string) => void;
  submitting: boolean;
  onAddRow: (cardId: string) => void;
  onEditRow: (cardId: string, rowId: string, patch: Partial<PurchaseRow>) => void;
  onRemoveRow: (cardId: string, rowId: string) => void;
  onDuplicateRow: (cardId: string, rowId: string) => void;
  onRemoveSection: (cardId: string) => void;
  onBillingMonthChange: (cardId: string, billingMonth: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const card = creditCards.find((c) => c.id === section.cardId);
        if (!card) return null;
        return (
          <CardSection
            key={section.cardId}
            card={card}
            rows={section.rows}
            billingMonth={section.billingMonth}
            onBillingMonthChange={(value) => onBillingMonthChange(section.cardId, value)}
            categories={categories}
            people={people}
            personId={personId}
            onPersonChange={onPersonChange}
            onAddRow={() => onAddRow(section.cardId)}
            onEditRow={(rowId, patch) => onEditRow(section.cardId, rowId, patch)}
            onRemoveRow={(rowId) => onRemoveRow(section.cardId, rowId)}
            onDuplicateRow={(rowId) => onDuplicateRow(section.cardId, rowId)}
            onRemoveSection={() => onRemoveSection(section.cardId)}
            disabled={submitting}
          />
        );
      })}
    </div>
  );
}

function collectSubmitItems(sections: Section[], creditCards: CreditCard[]): SubmitItem[] {
  return sections.flatMap((s) => {
    const closureType = creditCards.find((c) => c.id === s.cardId)?.closureType ?? "FIXED";
    return s.rows
      .filter((r) => r.status !== "success")
      .map((row) => ({
        cardId: s.cardId,
        closureType,
        billingMonth: resolveRowBillingMonth(row, s.billingMonth),
        row,
      }));
  });
}

async function submitToRows(
  toSubmit: SubmitItem[],
  personId: string,
  updateRow: (cardId: string, rowId: string, patch: Partial<PurchaseRow>) => void,
  setProgress: (progress: { current: number; total: number }) => void,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < toSubmit.length; i++) {
    const { cardId, closureType, billingMonth, row } = toSubmit[i];
    setProgress({ current: i + 1, total: toSubmit.length });

    const rowError = validateRow(row) ?? validateBillingMonth(billingMonth, closureType);
    if (rowError) {
      updateRow(cardId, row.rowId, { status: "error", error: rowError });
      failed++;
      continue;
    }

    updateRow(cardId, row.rowId, { status: "loading", error: undefined });
    try {
      const { isDuplicate } = await submitPurchase(personId, row, cardId, billingMonth);
      updateRow(cardId, row.rowId, { status: "success", isDuplicate, error: undefined });
      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      updateRow(cardId, row.rowId, { status: "error", error: message });
      failed++;
    }
  }

  return { succeeded, failed };
}

function reportSubmission(
  succeeded: number,
  failed: number,
  navigation: { refresh: () => void; goToTransactions: () => void },
) {
  if (succeeded > 0) toast.success(`${succeeded} compra(s) salva(s).`);
  if (failed > 0) {
    toast.error(`${failed} compra(s) com erro. Corrija e envie novamente.`);
    if (succeeded > 0) navigation.refresh();
    return;
  }
  if (succeeded > 0) navigation.goToTransactions();
}

function SubmitFooter({
  progress,
  submitting,
  onSubmit,
}: {
  progress: { current: number; total: number } | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      {progress && (
        <span className="text-sm text-muted-foreground">
          Enviando {progress.current} de {progress.total}…
        </span>
      )}
      <Button type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Enviando…" : "Enviar tudo"}
      </Button>
    </div>
  );
}
