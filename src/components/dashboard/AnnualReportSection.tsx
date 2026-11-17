"use client";

import { BarChart2, Table2 } from "lucide-react";
import { useState } from "react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { maskCurrency } from "@/lib/maskCurrency";
import { AnnualBalanceChart, fmtSigned } from "./AnnualBalanceCard";
import { AnnualReportCards } from "./AnnualReportCards";

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportSection({ report }: Props) {
  const [view, setView] = useState<"table" | "chart">("table");
  const { hidden } = usePrivacy();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ToggleGroup
          value={view}
          onValueChange={(next) => setView(next as "table" | "chart")}
          aria-label="Visualização"
        >
          <ToggleGroupItem value="table" className="px-3 py-3 data-pressed:font-medium">
            <Table2 className="w-3.5 h-3.5" />
            Tabela
          </ToggleGroupItem>
          <ToggleGroupItem value="chart" className="px-3 py-3 data-pressed:font-medium">
            <BarChart2 className="w-3.5 h-3.5" />
            Gráfico
          </ToggleGroupItem>
        </ToggleGroup>
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
            {maskCurrency(fmtSigned(report.totalBalance), hidden)}
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
