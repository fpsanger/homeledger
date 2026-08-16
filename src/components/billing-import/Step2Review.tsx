"use client";

import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import type { CategorySource, ReconciledItem } from "@/domain/entities/ReconciledItem";
import type { Step1Data } from "./BillingImportWizard";

type Category = { id: string; name: string; path: string; parentId: string | null };

type Props = {
  reconciledItems: ReconciledItem[];
  step1Data: Step1Data;
  onUpdate: (items: ReconciledItem[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const SOURCE_BADGE: Record<CategorySource, { label: string; className: string; title: string }> = {
  rule: {
    label: "Regra",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    title: "Categorizado por regra estática de merchant",
  },
  history: {
    label: "Histórico",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    title: "Categorizado pelo histórico de importações anteriores",
  },
  ai: {
    label: "IA",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    title: "Categorizado pelo Ollama (IA local)",
  },
};

const BANK_LABELS: Record<string, string> = {
  bradesco: "Bradesco",
  itau: "Itaú",
  c6: "C6 Bank",
  btg: "BTG",
  nubank: "Nubank",
  inter: "Inter",
  santander: "Santander",
  caixa: "Caixa",
  bb: "Banco do Brasil",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function Step2Review({ reconciledItems, step1Data, onUpdate, onNext, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorizing, setCategorizing] = useState(false);
  const [rowIds] = useState(() => reconciledItems.map(() => crypto.randomUUID()));

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  function updateItem(
    index: number,
    changes: Partial<{
      description: string;
      amount: number;
      transactionType: "EXPENSE" | "INCOME" | "INVESTMENT";
    }>,
  ) {
    onUpdate(
      reconciledItems.map((ri, i) =>
        i !== index ? ri : { ...ri, billingItem: { ...ri.billingItem, ...changes } },
      ),
    );
  }

  function updateCategory(index: number, categoryId: string) {
    onUpdate(
      reconciledItems.map((ri, i) =>
        i !== index
          ? ri
          : { ...ri, categoryId: categoryId || undefined, categorySource: undefined },
      ),
    );
  }

  function deleteItem(index: number) {
    onUpdate(reconciledItems.filter((_, i) => i !== index));
  }

  async function autoCategorize() {
    console.log("Iniciando auto-categorization para items:", reconciledItems);
    console.log("categories:", categories);
    if (categories.length === 0) {
      toast.error("Nenhuma categoria disponível.");
      return;
    }
    setCategorizing(true);
    try {
      const items = reconciledItems.map((ri, index) => ({
        index,
        description: ri.billingItem.description,
      }));
      console.log("items:", items);
      const res = await fetch("/api/billing/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, categories }),
      });
      const data = await res.json();
      const suggestions: { index: number; categoryId: string; source: CategorySource }[] =
        data.suggestions ?? [];
      if (suggestions.length === 0) {
        toast.error("IA não retornou sugestões. Verifique se o Ollama está rodando.");
        return;
      }
      const categoryIds = new Set(categories.map((c) => c.id));
      const validSuggestions = suggestions.filter((s) => categoryIds.has(s.categoryId));
      if (validSuggestions.length === 0) {
        toast.error("IA retornou categorias inválidas. Tente novamente.");
        return;
      }
      const updated = reconciledItems.map((ri, i) => {
        const suggestion = validSuggestions.find((s) => s.index === i);
        return suggestion
          ? { ...ri, categoryId: suggestion.categoryId, categorySource: suggestion.source }
          : ri;
      });
      onUpdate(updated);
      toast.success(`${validSuggestions.length} categorias sugeridas!`);
    } catch {
      toast.error("Erro ao categorizar automaticamente.");
    } finally {
      setCategorizing(false);
    }
  }

  const bankLabel =
    step1Data.detectedBank && step1Data.detectedBank !== "unknown"
      ? (BANK_LABELS[step1Data.detectedBank] ?? step1Data.detectedBank)
      : null;

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold">
            Etapa 2 — Revisar Itens Extraídos
            {bankLabel && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">· {bankLabel}</span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {reconciledItems.length} itens encontrados. Edite ou remova conforme necessário.
          </p>
        </div>
        <button
          type="button"
          onClick={autoCategorize}
          disabled={categorizing || reconciledItems.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {categorizing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Auto-categorizar
        </button>
      </div>

      {reconciledItems.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Nenhum item encontrado no extrato.
        </div>
      ) : (
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Descrição</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Valor</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Data</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Tipo</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Categoria</th>
                <th className="pb-3 font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {reconciledItems.map((ri, i) => {
                const item = ri.billingItem;
                return (
                  <tr key={rowIds[i]} className="hover:bg-muted/30">
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm bg-background min-w-[180px]"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        value={item.amount}
                        step="0.01"
                        min="0"
                        onChange={(e) => updateItem(i, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-28 border rounded px-2 py-1 text-sm bg-background"
                      />
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-2 pr-4">
                      {item.kind === "installment" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Parcela {item.installmentNumber}/{item.totalInstallments}
                        </span>
                      ) : item.kind === "refund" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Estorno
                        </span>
                      ) : step1Data.statementType === "credit-card" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Parcela 1/1
                        </span>
                      ) : (
                        <select
                          value={item.transactionType}
                          onChange={(e) =>
                            updateItem(i, {
                              transactionType: e.target.value as
                                | "EXPENSE"
                                | "INCOME"
                                | "INVESTMENT",
                            })
                          }
                          className="border rounded px-2 py-1 text-xs bg-background"
                        >
                          <option value="EXPENSE">Despesa</option>
                          <option value="INCOME">Receita</option>
                          <option value="INVESTMENT">Investimento</option>
                        </select>
                      )}
                    </td>
                    <td className="py-2 pr-4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <CategoryCombobox
                          categories={categories}
                          value={ri.categoryId ?? ""}
                          onChange={(id) => updateCategory(i, id)}
                          placeholder="Sem categoria"
                        />
                        {ri.categoryId &&
                          ri.categorySource &&
                          (() => {
                            const badge = SOURCE_BADGE[ri.categorySource];
                            return (
                              <span
                                title={badge.title}
                                className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                      </div>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => deleteItem(i)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
          onClick={onNext}
          disabled={reconciledItems.length === 0}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Parece bom, continuar
        </button>
      </div>
    </div>
  );
}
