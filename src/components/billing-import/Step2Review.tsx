"use client";

import { useEffect, useState } from "react";
import { Trash2, Sparkles, Loader2, Zap, History } from "lucide-react";
import { toast } from "sonner";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import type { Step1Data } from "./BillingImportWizard";
import { CategoryCombobox } from "@/components/ui/category-combobox";

type Category = { id: string; name: string; path: string; parentId: string | null };

type Props = {
  reconciledItems: ReconciledItem[];
  step1Data: Step1Data;
  onUpdate: (items: ReconciledItem[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const BANK_LABELS: Record<string, string> = {
  bradesco: "Bradesco", itau: "Itaú", c6: "C6 Bank", btg: "BTG",
  nubank: "Nubank", inter: "Inter", santander: "Santander", caixa: "Caixa", bb: "Banco do Brasil",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export function Step2Review({ reconciledItems, step1Data, onUpdate, onNext, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorizing, setCategorizing] = useState(false);
  const [categorySources, setCategorySources] = useState<Record<number, "rule" | "history" | "ai">>({});

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  function updateItem(
    index: number,
    changes: Partial<{ description: string; amount: number; transactionType: "EXPENSE" | "INCOME" | "INVESTMENT" }>,
  ) {
    onUpdate(reconciledItems.map((ri, i) => (i !== index ? ri : { ...ri, billingItem: { ...ri.billingItem, ...changes } })));
  }

  function updateCategory(index: number, categoryId: string) {
    onUpdate(reconciledItems.map((ri, i) => (i !== index ? ri : { ...ri, categoryId: categoryId || undefined })));
    setCategorySources((prev) => { const next = { ...prev }; delete next[index]; return next; });
  }

  function deleteItem(index: number) {
    onUpdate(reconciledItems.filter((_, i) => i !== index));
  }

  async function autoCategorize() {
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
      const res = await fetch("/api/billing/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, categories }),
      });
      const data = await res.json();
      const suggestions: { index: number; categoryId: string; source: "rule" | "history" | "ai" }[] = data.suggestions ?? [];
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
        return suggestion ? { ...ri, categoryId: suggestion.categoryId } : ri;
      });
      const sources: Record<number, "rule" | "history" | "ai"> = {};
      for (const s of validSuggestions) sources[s.index] = s.source;
      setCategorySources(sources);
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
          {categorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
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
                  <tr key={i} className="hover:bg-muted/30">
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
                      ) : step1Data.statementType === "credit-card" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Parcela 1/1
                        </span>
                      ) : (
                        <select
                          value={item.transactionType}
                          onChange={(e) =>
                            updateItem(i, { transactionType: e.target.value as "EXPENSE" | "INCOME" | "INVESTMENT" })
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
                      <CategoryCombobox
                        categories={categories}
                        value={ri.categoryId ?? ""}
                        onChange={(id) => updateCategory(i, id)}
                        placeholder="Sem categoria"
                      />
                      {categorySources[i] && (
                        <span
                          title={
                            categorySources[i] === "rule"
                              ? "Categorizado por regra automática"
                              : categorySources[i] === "history"
                                ? "Categorizado pelo histórico do usuário"
                                : "Categorizado por inteligência artificial"
                          }
                          className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            categorySources[i] === "rule"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : categorySources[i] === "history"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          }`}
                        >
                          {categorySources[i] === "rule" && <Zap className="w-2.5 h-2.5" />}
                          {categorySources[i] === "history" && <History className="w-2.5 h-2.5" />}
                          {categorySources[i] === "ai" && <Sparkles className="w-2.5 h-2.5" />}
                          {categorySources[i] === "rule" ? "Regra" : categorySources[i] === "history" ? "Histórico" : "IA"}
                        </span>
                      )}
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
