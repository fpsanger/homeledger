"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DuplicateWarning } from "@/components/transactions/DuplicateWarning";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCreditCardDuplicateCheck } from "@/hooks/useCreditCardDuplicateCheck";
import { useCrossEntityDuplicateCheck } from "@/hooks/useCrossEntityDuplicateCheck";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { parseCurrencyBR } from "@/lib/utils";
import {
  type CreditCard,
  isCreditFlagActive,
  toCents,
  useBillingMonth,
  useInstallmentAmounts,
  useSplitRows,
} from "./unifiedTransactionForm/billing";
import { CreditTypeFields } from "./unifiedTransactionForm/creditFields";
import {
  AmountField,
  type Category,
  type FormType,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  type Person,
  PersonField,
  TypeToggle,
} from "./unifiedTransactionForm/fields";
import {
  computeDuplicateCheckValues,
  deriveDuplicateMatch,
  type EditMode,
  getFieldLabels,
  getInitialFormState,
  getSubmitButtonLabel,
  type InitialValues,
  resolveSubmitTarget,
} from "./unifiedTransactionForm/submit";

type Props = {
  people: Person[];
  categories: Category[];
  creditCards: CreditCard[];
  defaultPersonId?: string;
  onSuccess?: () => void;
  editMode?: EditMode;
  initialValues?: InitialValues;
  allowedTypes?: FormType[];
};

export function UnifiedTransactionForm({
  people,
  categories,
  creditCards,
  defaultPersonId = "",
  onSuccess,
  editMode,
  initialValues,
  allowedTypes,
}: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const isEditMode = editMode !== undefined;

  const initial = getInitialFormState(initialValues, defaultPersonId, today);
  const [type, setType] = useState<FormType>(initial.type);
  const [personId, setPersonId] = useState(initial.personId);
  const amounts = useInstallmentAmounts(initial.amount);
  const { amount, installmentAmount, numberOfInstallments } = amounts;
  const [date, setDate] = useState(initial.date);
  const [description, setDescription] = useState(initial.description);

  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [paymentMethod, setPaymentMethod] = useState(initial.paymentMethod);
  const [source, setSource] = useState(initial.source);
  const [creditCardId, setCreditCardId] = useState(initial.creditCardId);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { billingMonth, setBillingMonth, resetBillingMonth } = useBillingMonth(
    date,
    creditCards.find((c) => c.id === creditCardId),
  );
  const splitTotalCents = toCents(amount);
  const {
    splitMode,
    splitRows,
    toggleSplitMode,
    addSplitPerson,
    removeSplitPerson,
    setSplitAmount,
    rebalanceForNewTotal,
    remainingCents: splitRemainingCents,
    isValid: isSplitValid,
    reset: resetSplit,
  } = useSplitRows(splitTotalCents, personId);
  const isCreditSplit = isCreditFlagActive(type, isEditMode, splitMode);
  // Creating a credit purchase puts the amount next to the installment count; every other case
  // (expense, income, editing a purchase) keeps the single shared amount field.
  const showInstallmentFields = type === "credit" && !isEditMode;

  function applyTotalCents(totalCents: number) {
    if (splitMode) rebalanceForNewTotal(totalCents);
  }

  const dup = computeDuplicateCheckValues(type, amount, date, paymentMethod, creditCardId);
  const duplicateTransaction = useDuplicateCheck(
    dup.dupType,
    dup.transactionAmount,
    date,
    refreshKey,
  );
  const duplicateCreditCard = useCreditCardDuplicateCheck(
    dup.creditAmount,
    dup.creditDate,
    dup.creditCardIdArg,
    refreshKey,
  );
  const duplicateCrossEntity = useCrossEntityDuplicateCheck(
    dup.crossAmount,
    dup.crossDate,
    dup.crossPaymentMethod,
    refreshKey,
  );

  const { duplicateMatch, isCrossType } = deriveDuplicateMatch(
    duplicateTransaction,
    duplicateCreditCard,
    duplicateCrossEntity,
  );

  function reset() {
    setPersonId("");
    amounts.reset();
    setDate(today);
    setCategoryId("");
    setDescription("");
    setPaymentMethod("CASH");
    setSource("SALARY");
    setCreditCardId("");
    resetBillingMonth();
    resetSplit();
    setRefreshKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const target = resolveSubmitTarget(editMode, type, {
      personId,
      amount,
      date,
      paymentMethod,
      source,
      creditCardId,
      categoryId,
      description,
      numberOfInstallments,
      billingMonth,
      ...(isCreditSplit
        ? {
            splits: splitRows.map((r) => ({
              personId: r.personId,
              amount: parseCurrencyBR(r.amount),
            })),
          }
        : {}),
    });

    if ("error" in target) {
      toast.error(target.error);
      setLoading(false);
      return;
    }

    const res = await fetch(target.url, {
      method: target.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target.body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Falha ao enviar.");
      return;
    }

    if (!isEditMode) {
      reset();
    }
    router.refresh();
    toast.success("Transação salva com sucesso.");
    onSuccess?.();
  }

  const typeLabels: Record<FormType, string> = {
    expense: "Despesa",
    income: "Receita",
    credit: "Compra com Cartão",
  };
  const { amountLabel, dateLabel } = getFieldLabels(type);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEditMode && (
        <TypeToggle
          allowedTypes={allowedTypes}
          type={type}
          typeLabels={typeLabels}
          onSelect={(t) => {
            setType(t);
            if (t !== "credit") resetSplit();
          }}
        />
      )}

      {!isCreditSplit && (
        <PersonField personId={personId} setPersonId={setPersonId} people={people} />
      )}

      {!showInstallmentFields && (
        <AmountField
          label={amountLabel}
          amount={amount}
          onAmountChange={(v) => applyTotalCents(amounts.setTotal(v))}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <Label>{dateLabel}</Label>
        <DatePicker value={date} onChange={setDate} required />
      </div>

      {type === "expense" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-payment">Forma de Pagamento</Label>
          <Select
            id="u-payment"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {type === "income" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-source">Fonte</Label>
          <Select id="u-source" value={source} onChange={(e) => setSource(e.target.value)} required>
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {type === "credit" && (
        <CreditTypeFields
          isEditMode={isEditMode}
          people={people}
          creditCardId={creditCardId}
          setCreditCardId={(id) => {
            setCreditCardId(id);
            resetBillingMonth();
          }}
          creditCards={creditCards}
          numberOfInstallments={numberOfInstallments}
          onCountChange={(v) => applyTotalCents(amounts.setCount(v))}
          amount={amount}
          installmentAmount={installmentAmount}
          onTotalChange={(v) => applyTotalCents(amounts.setTotal(v))}
          onInstallmentChange={(v) => applyTotalCents(amounts.setInstallment(v))}
          billingMonth={billingMonth}
          setBillingMonth={setBillingMonth}
          splitMode={splitMode}
          toggleSplitMode={toggleSplitMode}
          splitTotalCents={splitTotalCents}
          splitRows={splitRows}
          splitRemainingCents={splitRemainingCents}
          addSplitPerson={addSplitPerson}
          removeSplitPerson={removeSplitPerson}
          setSplitAmount={setSplitAmount}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <CategoryCombobox categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-description">Descrição</Label>
        <Input
          id="u-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      {!isEditMode && (
        <DuplicateWarning
          match={duplicateMatch}
          note={isCrossType ? "Compra de cartão com mesmo valor" : undefined}
        />
      )}

      <Button type="submit" disabled={loading || (splitMode && !isSplitValid)}>
        {getSubmitButtonLabel(loading, isEditMode, typeLabels[type])}
      </Button>
    </form>
  );
}
