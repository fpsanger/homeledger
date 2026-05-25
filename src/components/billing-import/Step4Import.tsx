"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import type { InstallmentBillingItem, TransactionBillingItem } from "@/domain/entities/BillingItem";
import type { Step1Data, ImportSummary } from "./BillingImportWizard";

type Props = {
  reconciledItems: ReconciledItem[];
  selectedIndices: number[];
  step1Data: Step1Data;
  onDone: (summary: ImportSummary) => void;
  onBack: () => void;
};

type ItemStatus = "pending" | "loading" | "success" | "error";

type InstallmentForm = {
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  purchaseDate: string;
  creditCardId: string;
  personId: string;
};

type TransactionForm = {
  description: string;
  amount: number;
  date: string;
  transactionType: "EXPENSE" | "INCOME" | "INVESTMENT";
  personId: string;
};

function estimatePurchaseDate(billingDate: Date | string, installmentNumber: number): string {
  const d = new Date(billingDate);
  d.setMonth(d.getMonth() - (installmentNumber - 1));
  return d.toISOString().slice(0, 10);
}

export function Step4Import({ reconciledItems, selectedIndices, step1Data, onDone, onBack }: Props) {
  const itemsToImport = selectedIndices.map((i) => reconciledItems[i]);
  const alreadyRegistered = reconciledItems.filter((ri) => ri.status === "matched").length;

  const [installmentForms, setInstallmentForms] = useState<InstallmentForm[]>(() =>
    itemsToImport.map((ri) => {
      const item = ri.billingItem as InstallmentBillingItem;
      if (item.kind !== "installment") return {} as InstallmentForm;
      return {
        description: item.description,
        totalAmount: item.amount * item.totalInstallments,
        numberOfInstallments: item.totalInstallments,
        purchaseDate: estimatePurchaseDate(item.date, item.installmentNumber),
        creditCardId: step1Data.creditCardId ?? "",
        personId: step1Data.personId,
      };
    }),
  );

  const [transactionForms, setTransactionForms] = useState<TransactionForm[]>(() =>
    itemsToImport.map((ri) => {
      const item = ri.billingItem as TransactionBillingItem;
      if (item.kind !== "transaction") return {} as TransactionForm;
      return {
        description: item.description,
        amount: item.amount,
        date: new Date(item.date).toISOString().slice(0, 10),
        transactionType: item.transactionType,
        personId: step1Data.personId,
      };
    }),
  );

  const [statuses, setStatuses] = useState<ItemStatus[]>(itemsToImport.map(() => "pending"));
  const [importing, setImporting] = useState(false);

  function setStatus(index: number, status: ItemStatus) {
    setStatuses((prev) => prev.map((s, i) => (i === index ? status : s)));
  }

  function updateInstallmentForm(index: number, changes: Partial<InstallmentForm>) {
    setInstallmentForms((prev) => prev.map((f, i) => (i === index ? { ...f, ...changes } : f)));
  }

  function updateTransactionForm(index: number, changes: Partial<TransactionForm>) {
    setTransactionForms((prev) => prev.map((f, i) => (i === index ? { ...f, ...changes } : f)));
  }

  async function importItem(index: number, ri: ReconciledItem): Promise<boolean> {
    const item = ri.billingItem;
    setStatus(index, "loading");
    try {
      if (item.kind === "installment") {
        const form = installmentForms[index];
        const res = await fetch("/api/installments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: form.personId,
            totalAmount: form.totalAmount,
            numberOfInstallments: form.numberOfInstallments,
            purchaseDate: form.purchaseDate,
            description: form.description,
            creditCardId: form.creditCardId,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro ao importar parcela");
        }
      } else {
        const form = transactionForms[index];
        const endpoint =
          form.transactionType === "INCOME"
            ? "/api/incomes"
            : form.transactionType === "INVESTMENT"
              ? "/api/investments"
              : "/api/expenses";

        const body: Record<string, unknown> = {
          personId: form.personId,
          amount: form.amount,
          date: form.date,
          description: form.description,
        };

        if (form.transactionType === "INCOME") {
          body.source = "OTHER";
        } else if (form.transactionType === "INVESTMENT") {
          body.categoryId = null;
        } else {
          body.paymentMethod = step1Data.statementType === "credit-card" ? "CREDIT_CARD" : "DEBIT_CARD";
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro ao importar transação");
        }
      }
      setStatus(index, "success");
      return true;
    } catch (err) {
      setStatus(index, "error");
      toast.error(`Erro ao importar: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      return false;
    }
  }

  async function handleImportAll() {
    setImporting(true);
    let successCount = 0;
    for (let i = 0; i < itemsToImport.length; i++) {
      const ok = await importItem(i, itemsToImport[i]);
      if (ok) successCount++;
    }
    toast.success(`${successCount} itens importados!`);
    onDone({ imported: successCount, alreadyRegistered });
    setImporting(false);
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-2">Etapa 4 — Confirmar Importação</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Revise os dados abaixo antes de importar.
      </p>

      <div className="space-y-4">
        {itemsToImport.map((ri, i) => {
          const item = ri.billingItem;
          const status = statuses[i];
          return (
            <div
              key={i}
              className={`rounded-lg border p-4 transition-colors ${
                status === "success"
                  ? "border-green-300 bg-green-50 dark:bg-green-900/10"
                  : status === "error"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.kind === "installment" ? "Compra Parcelada" : "Transação"}
                </span>
                <div className="flex items-center gap-1">
                  {status === "loading" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {status === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                </div>
              </div>

              {item.kind === "installment" ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
                    <input
                      type="text"
                      value={installmentForms[i]?.description ?? ""}
                      onChange={(e) => updateInstallmentForm(i, { description: e.target.value })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Valor Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={installmentForms[i]?.totalAmount ?? 0}
                      onChange={(e) => updateInstallmentForm(i, { totalAmount: parseFloat(e.target.value) || 0 })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nº de Parcelas</label>
                    <input
                      type="number"
                      min={1}
                      value={installmentForms[i]?.numberOfInstallments ?? 1}
                      onChange={(e) => updateInstallmentForm(i, { numberOfInstallments: parseInt(e.target.value) || 1 })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Data da Compra</label>
                    <input
                      type="date"
                      value={installmentForms[i]?.purchaseDate ?? ""}
                      onChange={(e) => updateInstallmentForm(i, { purchaseDate: e.target.value })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Parcela</label>
                    <input
                      type="text"
                      value={`${(item as InstallmentBillingItem).installmentNumber}/${(item as InstallmentBillingItem).totalInstallments}`}
                      disabled
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background opacity-60"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
                    <input
                      type="text"
                      value={transactionForms[i]?.description ?? ""}
                      onChange={(e) => updateTransactionForm(i, { description: e.target.value })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForms[i]?.amount ?? 0}
                      onChange={(e) => updateTransactionForm(i, { amount: parseFloat(e.target.value) || 0 })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Data</label>
                    <input
                      type="date"
                      value={transactionForms[i]?.date ?? ""}
                      onChange={(e) => updateTransactionForm(i, { date: e.target.value })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                    <select
                      value={transactionForms[i]?.transactionType ?? "EXPENSE"}
                      onChange={(e) => updateTransactionForm(i, { transactionType: e.target.value as "EXPENSE" | "INCOME" | "INVESTMENT" })}
                      disabled={status !== "pending"}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background disabled:opacity-60"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                      <option value="INVESTMENT">Investimento</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={importing}
          className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleImportAll}
          disabled={importing || itemsToImport.length === 0}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {importing && <Loader2 className="w-4 h-4 animate-spin" />}
          Importar todos ({itemsToImport.length})
        </button>
      </div>
    </div>
  );
}
