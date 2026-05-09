"use client";

import { useState } from "react";
import { BarChart2, Table2 } from "lucide-react";
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualReportCards } from "./AnnualReportCards";
import { AnnualBarChart } from "./AnnualBarChart";

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
        <AnnualBarChart months={report.months} />
      )}
    </div>
  );
}
