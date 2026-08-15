"use client";

import { BarChart2, Table2 } from "lucide-react";
import { useState } from "react";
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualBalanceChart, fmtSigned } from "./AnnualBalanceCard";
import { AnnualReportCards } from "./AnnualReportCards";

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
            aria-pressed={view === "table"}
            className={`flex items-center gap-1.5 px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10 ${
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
            aria-pressed={view === "chart"}
            className={`flex items-center gap-1.5 px-3 py-3 border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10 ${
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
        <div key="table" className="animate-fade-in">
          <AnnualReportCards report={report} />
        </div>
      ) : (
        <div key="chart" className="flex flex-col gap-1 pt-1 animate-fade-in">
          <p
            className={`text-2xl font-bold tabular-nums ${report.totalBalance >= 0 ? "amount-positive" : "amount-negative"}`}
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
