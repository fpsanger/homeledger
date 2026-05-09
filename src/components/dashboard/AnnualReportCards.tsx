import type { AnnualReportResult } from "@/domain/services/AnnualReport";
import { AnnualCard } from "./AnnualCard";

type Props = {
  report: AnnualReportResult;
};

export function AnnualReportCards({ report }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AnnualCard
        title="Income"
        total={report.totalIncome}
        months={report.months}
        field="income"
      />
      <AnnualCard
        title="Expenses"
        total={report.totalExpenses}
        months={report.months}
        field="expenses"
      />
      <AnnualCard
        title="Balance"
        total={report.totalBalance}
        months={report.months}
        field="balance"
      />
    </div>
  );
}
