"use client";

import { Trash2 } from "lucide-react";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";

type Props = {
  reconciledItems: ReconciledItem[];
  onUpdate: (items: ReconciledItem[]) => void;
  onNext: () => void;
  onBack: () => void;
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export function Step2Review({ reconciledItems, onUpdate, onNext, onBack }: Props) {
  function updateItem(index: number, changes: Partial<{ description: string; amount: number }>) {
    const updated = reconciledItems.map((ri, i) => {
      if (i !== index) return ri;
      return { ...ri, billingItem: { ...ri.billingItem, ...changes } };
    });
    onUpdate(updated);
  }

  function deleteItem(index: number) {
    onUpdate(reconciledItems.filter((_, i) => i !== index));
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-2">Etapa 2 — Revisar Itens Extraídos</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {reconciledItems.length} itens encontrados. Edite ou remova conforme necessário.
      </p>

      {reconciledItems.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Nenhum item encontrado no extrato.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Descrição</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Valor</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Data</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Tipo</th>
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
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.transactionType === "INCOME"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : item.transactionType === "INVESTMENT"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {item.transactionType === "INCOME" ? "Receita" : item.transactionType === "INVESTMENT" ? "Investimento" : "Despesa"}
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
