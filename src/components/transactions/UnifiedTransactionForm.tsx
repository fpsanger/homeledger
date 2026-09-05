"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DuplicateWarning } from "@/components/transactions/DuplicateWarning";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCreditCardDuplicateCheck } from "@/hooks/useCreditCardDuplicateCheck";
import { useCrossEntityDuplicateCheck } from "@/hooks/useCrossEntityDuplicateCheck";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { formatAmountBR, parseCurrencyBR } from "@/lib/utils";

type FormType = "expense" | "income" | "credit";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null };
type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

const MONTH_NAMES_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function computeBillingMonths(
  totalAmount: number,
  n: number,
  date: string,
  card: CreditCard,
): Array<{ installmentNumber: number; dueYear: number; dueMonth: number; amount: number }> {
  const d = new Date(`${date}T00:00:00Z`);
  const purchaseDay = d.getUTCDate();
  const purchaseYear = d.getUTCFullYear();
  const purchaseMonth = d.getUTCMonth() + 1;
  if (card.fixedClosureDay == null) {
    throw new Error("Credit card closure day must be resolved before calculating billing months");
  }
  const closureDay = card.fixedClosureDay;

  const shiftNext =
    card.alwaysNextMonth ||
    card.fixedClosurePreviousMonth ||
    (!card.closureNextMonth && purchaseDay >= closureDay);

  let firstYear = purchaseYear;
  let firstMonth = purchaseMonth;

  if (shiftNext) {
    const shiftBy = card.fixedClosurePreviousMonth && purchaseDay >= closureDay ? 2 : 1;
    const targetMonth = purchaseMonth + shiftBy;
    if (targetMonth > 12) {
      firstYear = purchaseYear + 1;
      firstMonth = targetMonth - 12;
    } else {
      firstMonth = targetMonth;
    }
  }

  const baseAmount = Math.floor((totalAmount / n) * 100) / 100;
  const firstAbsolute = (firstYear - 1) * 12 + (firstMonth - 1);

  return Array.from({ length: n }, (_, i) => {
    const absolute = firstAbsolute + i;
    const dueYear = Math.floor(absolute / 12) + 1;
    const dueMonth = (absolute % 12) + 1;
    const isLast = i === n - 1;
    const amount = isLast
      ? Math.round((totalAmount - baseAmount * (n - 1)) * 100) / 100
      : baseAmount;
    return { installmentNumber: i + 1, dueYear, dueMonth, amount };
  });
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
  { value: "ACCOUNT_DEBIT", label: "Débito em conta" },
];

const INCOME_SOURCES = [
  { value: "SALARY", label: "Salário" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "RENTAL", label: "Aluguel" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "OTHER", label: "Outro" },
];

type EditMode = {
  transactionId?: string;
  purchaseId?: string;
};

type InitialValues = {
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

type ClosureRecord = { year: number; month: number; closureDay: number; previousMonth: boolean };

type SplitRow = { personId: string; amount: string; edited: boolean };

function toCents(brValue: string): number {
  const n = parseCurrencyBR(brValue);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function fromCents(cents: number): string {
  return formatAmountBR(cents / 100);
}

function rebalanceSplits(rows: SplitRow[], totalCents: number): SplitRow[] {
  const editedCents = rows.filter((r) => r.edited).reduce((sum, r) => sum + toCents(r.amount), 0);
  const autoRows = rows.filter((r) => !r.edited);
  if (autoRows.length === 0) return rows;

  const remainingCents = Math.max(totalCents - editedCents, 0);
  const shareCents = Math.floor(remainingCents / autoRows.length);
  let assigned = 0;
  let autoIndex = 0;

  return rows.map((row) => {
    if (row.edited) return row;
    autoIndex += 1;
    const cents = autoIndex === autoRows.length ? remainingCents - assigned : shareCents;
    assigned += cents;
    return { ...row, amount: fromCents(cents) };
  });
}

function useSplitRows(totalCents: number, defaultPersonId: string) {
  const [splitMode, setSplitMode] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);

  function toggleSplitMode() {
    const turningOn = !splitMode;
    setSplitMode(turningOn);
    setSplitRows(
      turningOn && defaultPersonId
        ? [{ personId: defaultPersonId, amount: fromCents(totalCents), edited: false }]
        : [],
    );
  }

  function addSplitPerson(id: string) {
    if (!id) return;
    setSplitRows((rows) =>
      rebalanceSplits([...rows, { personId: id, amount: "0,00", edited: false }], totalCents),
    );
  }

  function removeSplitPerson(index: number) {
    setSplitRows((rows) =>
      rebalanceSplits(
        rows.filter((_, i) => i !== index),
        totalCents,
      ),
    );
  }

  function setSplitAmount(index: number, value: string) {
    setSplitRows((rows) =>
      rebalanceSplits(
        rows.map((r, i) => (i === index ? { ...r, amount: value, edited: true } : r)),
        totalCents,
      ),
    );
  }

  function rebalanceForNewTotal(newTotalCents: number) {
    setSplitRows((rows) => rebalanceSplits(rows, newTotalCents));
  }

  const allocatedCents = splitRows.reduce((sum, r) => sum + toCents(r.amount), 0);
  const remainingCents = totalCents - allocatedCents;
  const isValid = isSplitComplete(splitRows.length, remainingCents);

  return {
    splitMode,
    splitRows,
    toggleSplitMode,
    addSplitPerson,
    removeSplitPerson,
    setSplitAmount,
    rebalanceForNewTotal,
    remainingCents,
    isValid,
    reset: () => {
      setSplitMode(false);
      setSplitRows([]);
    },
  };
}

function isSplitComplete(rowCount: number, remainingCents: number): boolean {
  return rowCount >= 2 && remainingCents === 0;
}

function isCreditFlagActive(type: FormType, isEditMode: boolean, splitMode: boolean): boolean {
  return type === "credit" && !isEditMode && splitMode;
}

function PersonAndAmountFields({
  showPerson,
  personId,
  setPersonId,
  people,
  showAmount,
  amountLabel,
  amount,
  onAmountChange,
}: {
  showPerson: boolean;
  personId: string;
  setPersonId: (id: string) => void;
  people: Person[];
  showAmount: boolean;
  amountLabel: string;
  amount: string;
  onAmountChange: (v: string) => void;
}) {
  return (
    <>
      {showPerson && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-person">Pessoa</Label>
          <Select
            id="u-person"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
          >
            <option value="">Selecione a pessoa</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {showAmount && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-amount">{amountLabel}</Label>
          <CurrencyInput id="u-amount" value={amount} onChange={onAmountChange} required />
        </div>
      )}
    </>
  );
}

function TypeToggle({
  allowedTypes,
  type,
  typeLabels,
  onSelect,
}: {
  allowedTypes: FormType[] | undefined;
  type: FormType;
  typeLabels: Record<FormType, string>;
  onSelect: (t: FormType) => void;
}) {
  const types = allowedTypes ?? (["expense", "income", "credit"] as FormType[]);
  return (
    <div className="flex rounded-lg border overflow-hidden">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            type === t
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {typeLabels[t]}
        </button>
      ))}
    </div>
  );
}

function SplitStatus({ rowCount, remainingCents }: { rowCount: number; remainingCents: number }) {
  if (rowCount === 0) return null;
  if (rowCount < 2) {
    return <p className="text-sm text-destructive">Selecione ao menos 2 pessoas.</p>;
  }
  if (remainingCents === 0) {
    return <p className="text-sm text-muted-foreground">Valores conferem com o total.</p>;
  }
  const label = remainingCents > 0 ? "Faltam" : "acima do total:";
  const formatted = fromCents(Math.abs(remainingCents));
  return (
    <p className="text-sm text-destructive">
      {remainingCents > 0 ? `${label} R$ ${formatted}` : `R$ ${formatted} ${label}`}
    </p>
  );
}

function SplitPeopleFields({
  people,
  splitRows,
  remainingCents,
  onAddPerson,
  onRemovePerson,
  onAmountChange,
}: {
  people: Person[];
  splitRows: SplitRow[];
  remainingCents: number;
  onAddPerson: (id: string) => void;
  onRemovePerson: (index: number) => void;
  onAmountChange: (index: number, value: string) => void;
}) {
  const availablePeople = people.filter((p) => !splitRows.some((r) => r.personId === p.id));

  return (
    <div className="flex flex-col gap-2">
      <Select
        aria-label="Adicionar pessoa"
        value=""
        onChange={(e) => onAddPerson(e.target.value)}
        disabled={availablePeople.length === 0}
      >
        <option value="">Adicionar pessoa…</option>
        {availablePeople.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      {splitRows.map((row, index) => {
        const person = people.find((p) => p.id === row.personId);
        return (
          <div key={row.personId} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-sm">{person?.name}</span>
            <CurrencyInput
              aria-label={`Valor de ${person?.name ?? ""}`}
              value={row.amount}
              onChange={(v) => onAmountChange(index, v)}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemovePerson(index)}>
              Remover
            </Button>
          </div>
        );
      })}
      <SplitStatus rowCount={splitRows.length} remainingCents={remainingCents} />
    </div>
  );
}

function TotalOptions({ installmentAmount }: { installmentAmount: string }) {
  const parcela = parseCurrencyBR(installmentAmount);
  if (!parcela || parcela <= 0) {
    return <option value="">Informe o valor da parcela primeiro</option>;
  }
  return Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
    const total = (parcela * n).toFixed(2).replace(".", ",");
    return (
      <option key={n} value={String(n)}>
        {n}x = R$ {total}
      </option>
    );
  });
}

function ParcelaEntryFields({
  installmentAmount,
  onInstallmentAmountChange,
  numberOfInstallments,
  onTotalPicked,
}: {
  installmentAmount: string;
  onInstallmentAmountChange: (v: string) => void;
  numberOfInstallments: string;
  onTotalPicked: (n: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-installment-amount">Valor da Parcela</Label>
        <CurrencyInput
          id="u-installment-amount"
          value={installmentAmount}
          onChange={onInstallmentAmountChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-total-picker">Selecione o total</Label>
        <Select
          id="u-total-picker"
          value={numberOfInstallments}
          onChange={(e) => onTotalPicked(e.target.value)}
          required
        >
          <option value="">Selecione</option>
          <TotalOptions installmentAmount={installmentAmount} />
        </Select>
      </div>
    </>
  );
}

function InstallmentCountOptions({ amount }: { amount: string }) {
  const total = parseCurrencyBR(amount);
  if (!total || total <= 0) {
    return <option value="">Informe o valor primeiro</option>;
  }
  return Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
    const perInstallment = (total / n).toFixed(2).replace(".", ",");
    return (
      <option key={n} value={String(n)}>
        {n}x de R$ {perInstallment}
      </option>
    );
  });
}

function InstallmentPreview({
  amount,
  date,
  selectedCard,
  numberOfInstallments,
  cardClosures,
}: {
  amount: string;
  date: string;
  selectedCard: CreditCard | undefined;
  numberOfInstallments: string;
  cardClosures: ClosureRecord[];
}) {
  const total = parseCurrencyBR(amount);
  if (!selectedCard || !total || total <= 0 || !date) return null;
  const n = parseInt(numberOfInstallments, 10);
  if (!n || n < 1) return null;

  if (selectedCard.closureType === "VARIABLE") {
    const d = new Date(`${date}T00:00:00Z`);
    const purchaseYear = d.getUTCFullYear();
    const purchaseMonth = d.getUTCMonth() + 1;
    const closure = cardClosures.find((c) => c.year === purchaseYear && c.month === purchaseMonth);
    if (!closure) {
      return (
        <p className="text-xs text-amber-600">
          Fechamento do mês {MONTH_NAMES_PT[purchaseMonth - 1]}/{purchaseYear} não configurado.
          Adicione um fechamento para este cartão antes de registrar a compra.
        </p>
      );
    }
    const variableCard = {
      ...selectedCard,
      fixedClosureDay: closure.closureDay,
      fixedClosurePreviousMonth: closure.previousMonth,
    };
    const months = computeBillingMonths(total, n, date, variableCard);
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 flex flex-col gap-1">
        {months.map(({ installmentNumber, dueYear, dueMonth, amount: installAmount }) => (
          <div
            key={installmentNumber}
            className="flex justify-between text-xs text-muted-foreground"
          >
            <span>
              Parcela {installmentNumber}/{n}
            </span>
            <span>
              {MONTH_NAMES_PT[dueMonth - 1]}/{dueYear} — {formatAmountBR(installAmount)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const months = computeBillingMonths(total, n, date, selectedCard);
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 flex flex-col gap-1">
      {months.map(({ installmentNumber, dueYear, dueMonth, amount: installAmount }) => (
        <div key={installmentNumber} className="flex justify-between text-xs text-muted-foreground">
          <span>
            Parcela {installmentNumber}/{n}
          </span>
          <span>
            {MONTH_NAMES_PT[dueMonth - 1]}/{dueYear} — {formatAmountBR(installAmount)}
          </span>
        </div>
      ))}
    </div>
  );
}

type SubmitFields = {
  personId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  source: string;
  creditCardId: string;
  categoryId: string;
  description: string;
  numberOfInstallments: string;
  splits?: { personId: string; amount: number }[];
};

type SubmitTarget = { url: string; method: string; body: Record<string, unknown> };

function resolveEditTarget(
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

function resolveCreateTarget(type: FormType, fields: SubmitFields): SubmitTarget {
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
      categoryId: fields.categoryId || null,
      description: fields.description,
    },
  };
}

function resolveSubmitTarget(
  editMode: EditMode | undefined,
  type: FormType,
  fields: SubmitFields,
): SubmitTarget | { error: string } {
  if (editMode) return resolveEditTarget(editMode, type, fields);
  return resolveCreateTarget(type, fields);
}

function computeDuplicateCheckValues(
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

function computeCreditCrossDuplicateValues(
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

function getInitialFormState(
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

function deriveDuplicateMatch<A, B, C>(
  duplicateTransaction: A | null,
  duplicateCreditCard: B | null,
  duplicateCrossEntity: C | null,
) {
  return {
    duplicateMatch: duplicateTransaction ?? duplicateCreditCard ?? duplicateCrossEntity,
    isCrossType: !duplicateTransaction && !!duplicateCrossEntity,
  };
}

function getFieldLabels(type: FormType) {
  return {
    amountLabel: type === "credit" ? "Valor Total" : "Valor",
    dateLabel: type === "credit" ? "Data da Compra" : "Data",
  };
}

function getSubmitButtonLabel(loading: boolean, isEditMode: boolean, typeLabel: string) {
  if (loading) return isEditMode ? "Salvando…" : "Adicionando…";
  return isEditMode ? "Salvar alterações" : `Adicionar ${typeLabel}`;
}

function AmountEntrySection({
  parcelaMode,
  toggleParcelaMode,
  amount,
  date,
  creditCardId,
  creditCards,
  cardClosures,
  numberOfInstallments,
  setNumberOfInstallments,
  installmentAmount,
  setInstallmentAmount,
  onTotalPicked,
}: {
  parcelaMode: boolean;
  toggleParcelaMode: () => void;
  amount: string;
  date: string;
  creditCardId: string;
  creditCards: CreditCard[];
  cardClosures: ClosureRecord[];
  numberOfInstallments: string;
  setNumberOfInstallments: (n: string) => void;
  installmentAmount: string;
  setInstallmentAmount: (v: string) => void;
  onTotalPicked: (n: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={parcelaMode ? undefined : "u-installments"}>Parcelas</Label>
        <Button type="button" variant="outline" size="sm" onClick={toggleParcelaMode}>
          {parcelaMode ? "Informar valor total" : "Informar valor da parcela"}
        </Button>
      </div>
      {parcelaMode ? (
        <ParcelaEntryFields
          installmentAmount={installmentAmount}
          onInstallmentAmountChange={setInstallmentAmount}
          numberOfInstallments={numberOfInstallments}
          onTotalPicked={onTotalPicked}
        />
      ) : (
        <Select
          id="u-installments"
          value={numberOfInstallments}
          onChange={(e) => setNumberOfInstallments(e.target.value)}
          required
        >
          <InstallmentCountOptions amount={amount} />
        </Select>
      )}
      <InstallmentPreview
        amount={amount}
        date={date}
        selectedCard={creditCards.find((c) => c.id === creditCardId)}
        numberOfInstallments={numberOfInstallments}
        cardClosures={cardClosures}
      />
    </div>
  );
}

function CreditTypeFields({
  isEditMode,
  people,
  creditCardId,
  setCreditCardId,
  creditCards,
  numberOfInstallments,
  setNumberOfInstallments,
  amount,
  date,
  cardClosures,
  splitMode,
  toggleSplitMode,
  splitTotalCents,
  splitRows,
  splitRemainingCents,
  addSplitPerson,
  removeSplitPerson,
  setSplitAmount,
  parcelaMode,
  toggleParcelaMode,
  installmentAmount,
  setInstallmentAmount,
  onTotalPicked,
}: {
  isEditMode: boolean;
  people: Person[];
  creditCardId: string;
  setCreditCardId: (id: string) => void;
  creditCards: CreditCard[];
  numberOfInstallments: string;
  setNumberOfInstallments: (n: string) => void;
  amount: string;
  date: string;
  cardClosures: ClosureRecord[];
  splitMode: boolean;
  toggleSplitMode: () => void;
  splitTotalCents: number;
  splitRows: SplitRow[];
  splitRemainingCents: number;
  addSplitPerson: (id: string) => void;
  removeSplitPerson: (index: number) => void;
  setSplitAmount: (index: number, value: string) => void;
  parcelaMode: boolean;
  toggleParcelaMode: () => void;
  installmentAmount: string;
  setInstallmentAmount: (v: string) => void;
  onTotalPicked: (n: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-card">Cartão de Crédito</Label>
        <Select
          id="u-card"
          value={creditCardId}
          onChange={(e) => setCreditCardId(e.target.value)}
          required
        >
          <option value="">Selecione o cartão</option>
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      {!isEditMode && (
        <AmountEntrySection
          parcelaMode={parcelaMode}
          toggleParcelaMode={toggleParcelaMode}
          amount={amount}
          date={date}
          creditCardId={creditCardId}
          creditCards={creditCards}
          cardClosures={cardClosures}
          numberOfInstallments={numberOfInstallments}
          setNumberOfInstallments={setNumberOfInstallments}
          installmentAmount={installmentAmount}
          setInstallmentAmount={setInstallmentAmount}
          onTotalPicked={onTotalPicked}
        />
      )}
      {!isEditMode && (
        <div className="flex flex-col gap-2 rounded-md border border-input p-3">
          <div className="flex items-center justify-between">
            <Label>Dividir com outras pessoas</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={splitTotalCents <= 0}
              onClick={toggleSplitMode}
            >
              {splitMode ? "Cancelar divisão" : "Dividir"}
            </Button>
          </div>
          {splitMode && (
            <SplitPeopleFields
              people={people}
              splitRows={splitRows}
              remainingCents={splitRemainingCents}
              onAddPerson={addSplitPerson}
              onRemovePerson={removeSplitPerson}
              onAmountChange={setSplitAmount}
            />
          )}
        </div>
      )}
    </>
  );
}

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
