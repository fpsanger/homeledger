"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryCombobox } from "@/components/ui/category-combobox";

type FormType = "expense" | "income" | "credit";

type Person = { id: string; name: string };
type Category = { id: string; name: string; parentId: string | null; path: string };
type CreditCard = { id: string; name: string };

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
  { value: "BOLETO", label: "Boleto" },
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
  onSuccess?: () => void;
  editMode?: EditMode;
  initialValues?: InitialValues;
};

export function UnifiedTransactionForm({ people, categories, creditCards, onSuccess, editMode, initialValues }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const isEditMode = editMode !== undefined;

  const [type, setType] = useState<FormType>(initialValues?.type ?? "expense");
  const [personId, setPersonId] = useState(initialValues?.personId ?? "");
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

  const dupType: "EXPENSE" | "INCOME" = type === "income" ? "INCOME" : "EXPENSE";
  const isDuplicate = useDuplicateCheck(
    dupType,
    type !== "credit" && amount ? parseFloat(amount) : null,
    date,
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
          body = { personId, amount: parseFloat(amount), date, paymentMethod, categoryId: categoryId || null, description };
        } else {
          url = `/api/incomes/${editMode.transactionId}`;
          body = { personId, amount: parseFloat(amount), date, source, categoryId: categoryId || null, description };
        }
      } else if (editMode.purchaseId) {
        url = `/api/credit-card-purchases/${editMode.purchaseId}`;
        body = { description, totalAmount: parseFloat(amount), purchaseDate: date, categoryId: categoryId || null, creditCardId };
      } else {
        toast.error("ID da compra não encontrado.");
        setLoading(false);
        return;
      }
    } else {
      method = "POST";
      if (type === "expense") {
        url = "/api/expenses";
        body = { personId, amount: parseFloat(amount), date, paymentMethod, categoryId: categoryId || null, description };
      } else if (type === "income") {
        url = "/api/incomes";
        body = { personId, amount: parseFloat(amount), date, source, categoryId: categoryId || null, description };
      } else {
        url = "/api/installments";
        body = {
          personId,
          creditCardId,
          totalAmount: parseFloat(amount),
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
        <Select id="u-person" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Selecione a pessoa</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-amount">{type === "credit" ? "Valor Total" : "Valor"}</Label>
        <CurrencyInput
          id="u-amount"
          value={amount}
          onChange={(v) => { setAmount(v); setNumberOfInstallments(""); }}
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
          <Select id="u-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
      )}

      {type === "income" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-source">Fonte</Label>
          <Select id="u-source" value={source} onChange={(e) => setSource(e.target.value)} required>
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      )}

      {type === "credit" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-card">Cartão de Crédito</Label>
            <Select id="u-card" value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} required>
              <option value="">Selecione o cartão</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
                  const total = parseFloat(amount);
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
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <CategoryCombobox
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
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

      {!isEditMode && isDuplicate && (
        <p className="text-sm text-amber-600">
          Uma transação com o mesmo valor, data e tipo já existe neste mês. Você pode continuar mesmo assim.
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading
          ? isEditMode ? "Salvando…" : "Adicionando…"
          : isEditMode ? "Salvar alterações" : `Adicionar ${typeLabels[type]}`}
      </Button>

    </form>
  );
}
