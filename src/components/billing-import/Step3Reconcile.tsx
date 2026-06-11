"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import type { Step1Data } from "./BillingImportWizard";

type Props = {
  reconciledItems: ReconciledItem[];
  step1Data: Step1Data;
  onNext: (selectedIndices: number[]) => void;
  onBack: () => void;
  onAllMatched: () => void;
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function Step3Reconcile({ reconciledItems, onNext, onBack, onAllMatched }: Props) {
  const missingIndices = reconciledItems
    .map((ri, i) => (ri.status === "missing" ? i : null))
    .filter((i): i is number => i !== null);

  const [selected, setSelected] = useState<Set<number>>(new Set(missingIndices));

  function toggleItem(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (missingIndices.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Etapa 3 — Reconciliação</h2>
        <div className="py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium">Tudo já está registrado! 🎉</p>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os {reconciledItems.length} itens já estão na sua base de dados.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onAllMatched}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-2">Etapa 3 — Reconciliação</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {missingIndices.length} itens não encontrados de {reconciledItems.length} totais.
        Selecione os que deseja importar.
      </p>

      <div className="space-y-2">
        {reconciledItems.map((ri, i) => {
          const item = ri.billingItem;
          const isMissing = ri.status === "missing";
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isMissing
                  ? selected.has(i)
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10"
                    : "border-muted"
                  : "border-muted bg-muted/20 opacity-60"
              }`}
            >
              {isMissing ? (
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleItem(i)}
                  className="accent-primary w-4 h-4 shrink-0"
                />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.date)}
                  {item.kind === "installment" && ` · Parcela ${item.installmentNumber}/${item.totalInstallments}`}
                </p>
              </div>

              <div className="text-sm font-medium shrink-0">
                R$ {item.amount.toFixed(2).replace(".", ",")}
              </div>

              <div className="shrink-0">
                {isMissing ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <XCircle className="w-3 h-3" />
                    Não encontrado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="w-3 h-3" />
                    Já registrado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => onNext(Array.from(selected))}
          disabled={selected.size === 0}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Importar selecionados ({selected.size})
        </button>
      </div>
    </div>
  );
}
