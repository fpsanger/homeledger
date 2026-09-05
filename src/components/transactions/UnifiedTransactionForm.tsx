"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  type ClosureRecord,
  type CreditCard,
  fromCents,
  isCreditFlagActive,
  toCents,
  useSplitRows,
} from "./unifiedTransactionForm/billing";
import { CreditTypeFields } from "./unifiedTransactionForm/creditFields";
import {
  type Category,
  type FormType,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  type Person,
  PersonAndAmountFields,
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
  const [amount, setAmount] = useState(initial.amount);
  const [date, setDate] = useState(initial.date);
  const [description, setDescription] = useState(initial.description);

  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [paymentMethod, setPaymentMethod] = useState(initial.paymentMethod);
  const [source, setSource] = useState(initial.source);
  const [creditCardId, setCreditCardId] = useState(initial.creditCardId);
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [cardClosures, setCardClosures] = useState<ClosureRecord[]>([]);
  const [parcelaMode, setParcelaMode] = useState(false);
  const [installmentAmount, setInstallmentAmount] = useState("");

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
  const isParcelaMode = isCreditFlagActive(type, isEditMode, parcelaMode);

  function toggleParcelaMode() {
    if (!parcelaMode) {
      setAmount("");
      setNumberOfInstallments("");
      if (splitMode) rebalanceForNewTotal(0);
    }
    setParcelaMode(!parcelaMode);
    setInstallmentAmount("");
  }

  function handleTotalPicked(value: string) {
    const n = parseInt(value, 10);
    if (!n) return;
    const totalCents = toCents(installmentAmount) * n;
    setAmount(fromCents(totalCents));
    setNumberOfInstallments(value);
    if (splitMode) rebalanceForNewTotal(totalCents);
  }

  useEffect(() => {
    const card = creditCards.find((c) => c.id === creditCardId);
    if (!card || card.closureType !== "VARIABLE") {
      setCardClosures([]);
      return;
    }
    fetch(`/api/credit-cards/${creditCardId}/closures`)
      .then((r) => r.json())
      .then((data) => setCardClosures(data.closures ?? []))
      .catch(() => setCardClosures([]));
  }, [creditCardId, creditCards]);

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
    setAmount("");
    setDate(today);
    setCategoryId("");
    setDescription("");
    setPaymentMethod("CASH");
    setSource("SALARY");
    setCreditCardId("");
    setNumberOfInstallments("2");
    resetSplit();
    setParcelaMode(false);
    setInstallmentAmount("");
    setRefreshKey((k) => k + 1);
  }

  function handleAmountChange(v: string) {
    setAmount(v);
    setNumberOfInstallments("1");
    if (splitMode) rebalanceForNewTotal(toCents(v));
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
            if (t !== "credit") {
              resetSplit();
              setParcelaMode(false);
            }
          }}
        />
      )}

      <PersonAndAmountFields
        showPerson={!isCreditSplit}
        personId={personId}
        setPersonId={setPersonId}
        people={people}
        showAmount={!isParcelaMode}
        amountLabel={amountLabel}
        amount={amount}
        onAmountChange={handleAmountChange}
      />

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
          setCreditCardId={setCreditCardId}
          creditCards={creditCards}
          numberOfInstallments={numberOfInstallments}
          setNumberOfInstallments={setNumberOfInstallments}
          amount={amount}
          date={date}
          cardClosures={cardClosures}
          splitMode={splitMode}
          toggleSplitMode={toggleSplitMode}
          splitTotalCents={splitTotalCents}
          splitRows={splitRows}
          splitRemainingCents={splitRemainingCents}
          addSplitPerson={addSplitPerson}
          removeSplitPerson={removeSplitPerson}
          setSplitAmount={setSplitAmount}
          parcelaMode={parcelaMode}
          toggleParcelaMode={toggleParcelaMode}
          installmentAmount={installmentAmount}
          setInstallmentAmount={setInstallmentAmount}
          onTotalPicked={handleTotalPicked}
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
