"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { useCreditCardDuplicateCheck } from "@/hooks/useCreditCardDuplicateCheck";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { parseCurrencyBR, formatAmountBR } from "@/lib/utils";

type FormType = "expense" | "income" | "credit";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };
type CreditCard = {
  id: string;
  name: string;
  closureType: "FIXED" | "VARIABLE";
  fixedClosureDay: number | null;
  fixedClosurePreviousMonth: boolean;
  alwaysNextMonth: boolean;
  closureNextMonth: boolean;
};

const MONTH_NAMES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
};

export function UnifiedTransactionForm({
  people,
  categories,
  creditCards,
  defaultPersonId = "",
  onSuccess,
  editMode,
  initialValues,
}: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const isEditMode = editMode !== undefined;

  const [type, setType] = useState<FormType>(initialValues?.type ?? "expense");
  const [personId, setPersonId] = useState(initialValues?.personId ?? defaultPersonId);
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [date, setDate] = useState(initialValues?.date ?? today);
  const [description, setDescription] = useState(initialValues?.description ?? "");

  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initialValues?.paymentMethod ?? "CASH");
  const [source, setSource] = useState(initialValues?.source ?? "SALARY");
  const [creditCardId, setCreditCardId] = useState(initialValues?.creditCardId ?? "");
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  type ClosureRecord = { year: number; month: number; closureDay: number; previousMonth: boolean };
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

  const dupType: "EXPENSE" | "INCOME" = type === "income" ? "INCOME" : "EXPENSE";
  const isDuplicate = useDuplicateCheck(
    dupType,
    type !== "credit" && amount ? parseCurrencyBR(amount) : null,
    date,
    refreshKey,
  );
  const isCreditDuplicate = useCreditCardDuplicateCheck(
    type === "credit" && amount ? parseCurrencyBR(amount) : null,
    type === "credit" ? date : null,
    type === "credit" ? creditCardId : null,
    refreshKey,
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

    let url: string;
    let body: Record<string, unknown>;
    let method: string;

    if (isEditMode) {
      method = "PUT";
      if (editMode.transactionId) {
        if (type === "expense") {
          url = `/api/expenses/${editMode.transactionId}`;
          body = {
            personId,
            amount: parseCurrencyBR(amount),
            date,
            paymentMethod,
            categoryId: categoryId || null,
            description,
          };
        } else {
          url = `/api/incomes/${editMode.transactionId}`;
          body = {
            personId,
            amount: parseCurrencyBR(amount),
            date,
            source,
            categoryId: categoryId || null,
            description,
          };
        }
      } else if (editMode.purchaseId) {
        url = `/api/credit-card-purchases/${editMode.purchaseId}`;
        body = {
          description,
          totalAmount: parseCurrencyBR(amount),
          purchaseDate: date,
          categoryId: categoryId || null,
          creditCardId,
        };
      } else {
        toast.error("ID da compra não encontrado.");
        setLoading(false);
        return;
      }
    } else {
      method = "POST";
      if (type === "expense") {
        url = "/api/expenses";
        body = {
          personId,
          amount: parseCurrencyBR(amount),
          date,
          paymentMethod,
          categoryId: categoryId || null,
          description,
        };
      } else if (type === "income") {
        url = "/api/incomes";
        body = {
          personId,
          amount: parseCurrencyBR(amount),
          date,
          source,
          categoryId: categoryId || null,
          description,
        };
      } else {
        url = "/api/installments";
        body = {
          personId,
          creditCardId,
          totalAmount: parseCurrencyBR(amount),
          numberOfInstallments: parseInt(numberOfInstallments, 10),
          purchaseDate: date,
          categoryId: categoryId || null,
          description,
        };
      }
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEditMode && (
        <div className="flex rounded-lg border overflow-hidden">
          {(["expense", "income", "credit"] as FormType[]).map((t) => (
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
        <Label htmlFor="u-amount">{type === "credit" ? "Valor Total" : "Valor"}</Label>
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
        <Label>{type === "credit" ? "Data da Compra" : "Data"}</Label>
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
                {(() => {
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
                })()}
              </Select>
              {(() => {
                const selectedCard = creditCards.find((c) => c.id === creditCardId);
                const total = parseCurrencyBR(amount);
                if (!selectedCard || !total || total <= 0 || !date) return null;
                const n = parseInt(numberOfInstallments, 10);
                if (!n || n < 1) return null;

                if (selectedCard.closureType === "VARIABLE") {
                  const d = new Date(`${date}T00:00:00Z`);
                  const purchaseYear = d.getUTCFullYear();
                  const purchaseMonth = d.getUTCMonth() + 1;
                  const closure = cardClosures.find(
                    (c) => c.year === purchaseYear && c.month === purchaseMonth,
                  );
                  if (!closure) {
                    return (
                      <p className="text-xs text-amber-600">
                        Fechamento do mês {MONTH_NAMES_PT[purchaseMonth - 1]}/{purchaseYear} não
                        configurado. Adicione um fechamento para este cartão antes de registrar a
                        compra.
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
                          <span>Parcela {installmentNumber}/{n}</span>
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
              })()}
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

      {!isEditMode && (isDuplicate || isCreditDuplicate) && (
        <p className="text-sm text-amber-600">
          Uma transação com o mesmo valor, data e tipo já existe neste mês. Você pode continuar
          mesmo assim.
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading
          ? isEditMode
            ? "Salvando…"
            : "Adicionando…"
          : isEditMode
            ? "Salvar alterações"
            : `Adicionar ${typeLabels[type]}`}
      </Button>
    </form>
  );
}
