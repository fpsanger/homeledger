"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import type { ImportSummary } from "./types";

type Props = {
  summary: ImportSummary;
  onReset: () => void;
};

export function Step5Done({ summary, onReset }: Props) {
  return (
    <div className="bg-card rounded-lg border p-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Importação Concluída!</h2>
      <div className="text-muted-foreground text-sm space-y-1 mb-8">
        {summary.imported > 0 && (
          <p>
            <span className="font-medium text-foreground">{summary.imported}</span>{" "}
            {summary.imported === 1 ? "item importado" : "itens importados"} com sucesso.
          </p>
        )}
        {summary.alreadyRegistered > 0 && (
          <p>
            <span className="font-medium text-foreground">{summary.alreadyRegistered}</span>{" "}
            {summary.alreadyRegistered === 1
              ? "item já estava registrado"
              : "itens já estavam registrados"}
            .
          </p>
        )}
        {summary.imported === 0 && summary.alreadyRegistered === 0 && (
          <p>Nenhum item foi processado.</p>
        )}
      </div>
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors"
        >
          Importar outro extrato
        </button>
        <Link
          href="/installments"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          Ir para parcelas
        </Link>
      </div>
    </div>
  );
}
