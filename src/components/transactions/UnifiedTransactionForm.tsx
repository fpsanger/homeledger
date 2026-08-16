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
  const closureDay = card.fixedClosureDay!;

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
      personId: fields.personId,
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
        <div className="flex rounded-lg border overflow-hidden">
          {(allowedTypes ?? (["expense", "income", "credit"] as FormType[])).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
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
      )}

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-amount">{amountLabel}</Label>
        <CurrencyInput
          id="u-amount"
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setNumberOfInstallments("1");
          }}
          required
        />
      </div>

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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="u-installments">Parcelas</Label>
              <Select
                id="u-installments"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(e.target.value)}
                required
              >
                <InstallmentCountOptions amount={amount} />
              </Select>
              <InstallmentPreview
                amount={amount}
                date={date}
                selectedCard={creditCards.find((c) => c.id === creditCardId)}
                numberOfInstallments={numberOfInstallments}
                cardClosures={cardClosures}
              />
            </div>
          )}
        </>
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

      <Button type="submit" disabled={loading}>
        {getSubmitButtonLabel(loading, isEditMode, typeLabels[type])}
      </Button>
    </form>
  );
}
