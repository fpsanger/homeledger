import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualCard } from "./AnnualCard";

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportCards({ report }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AnnualCard
        title="Receita"
        total={report.totalIncome}
        months={report.months}
        field="income"
      />
      <AnnualCard
        title="Despesas"
        total={report.totalExpenses}
        months={report.months}
        field="expenses"
      />
      <AnnualCard
        title="Saldo"
        total={report.totalBalance}
        months={report.months}
        field="balance"
      />
    </div>
  );
}
