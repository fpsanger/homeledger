"use client";

import { useState } from "react";
import { BarChart2, Table2 } from "lucide-react";
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualReportCards } from "./AnnualReportCards";
import { AnnualBalanceChart, fmtSigned } from "./AnnualBalanceCard";

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportSection({ report }: Props) {
  const [view, setView] = useState<"table" | "chart">("table");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="flex rounded-md border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              view === "table"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Tabela
          </button>
          <button
            type="button"
            onClick={() => setView("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-l transition-colors ${
              view === "chart"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Gráfico
          </button>
        </div>
      </div>

      {view === "table" ? (
        <AnnualReportCards report={report} />
      ) : (
        <div className="flex flex-col gap-1 pt-1">
          <p
            className={`text-2xl font-bold tabular-nums ${report.totalBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            {fmtSigned(report.totalBalance)}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Diferença entre receitas e despesas por mês
          </p>
          <AnnualBalanceChart months={report.months} />
        </div>
      )}
    </div>
  );
}
