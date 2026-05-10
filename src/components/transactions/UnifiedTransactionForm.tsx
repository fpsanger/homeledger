"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FormType = "expense" | "income" | "credit";

type Person = { id: string; name: string };
type Category = { id: string; name: string; path: string };
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
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initialValues?.paymentMethod ?? "CASH");
  const [source, setSource] = useState(initialValues?.source ?? "SALARY");
  const [creditCardId, setCreditCardId] = useState(initialValues?.creditCardId ?? "");
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
        setError("ID da compra não encontrado.");
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
      setError(data.error ?? "Falha ao enviar.");
      return;
    }

    if (!isEditMode) {
      reset();
    }
    router.refresh();
    onSuccess?.();
  }

  const typeLabels: Record<FormType, string> = {
    expense: "Despesa",
    income: "Receita",
    credit: "Compra Parcelada",
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
        <Input
          id="u-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-date">{type === "credit" ? "Data da Compra" : "Data"}</Label>
        <Input id="u-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
              <Input
                id="u-installments"
                type="number"
                min="2"
                step="1"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(e.target.value)}
                required
              />
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-category">Categoria</Label>
        <Select id="u-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Nenhuma</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.path || c.name}</option>
          ))}
        </Select>
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
