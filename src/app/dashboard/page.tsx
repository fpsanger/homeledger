import { cookies } from "next/headers";
import Link from "next/link";
import { AnnualReportSection } from "@/components/dashboard/AnnualReportSection";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { IncomeExpenseBalanceCard } from "@/components/dashboard/IncomeExpenseBalanceCard";
import { InvestmentOverviewCard } from "@/components/dashboard/InvestmentOverviewCard";
import { MonthlyExpensesCard } from "@/components/dashboard/MonthlyExpensesCard";
import { MonthlySummaryCard } from "@/components/dashboard/MonthlySummaryCard";
import { RetryButton } from "@/components/dashboard/RetryButton";
import { YearNav } from "@/components/dashboard/YearNav";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";

type Category = { id: string; name: string; parentId: string | null };
type Person = { id: string; name: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people ?? [];
}

async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/api/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories;
}

async function getMonthlyView(year: number, month: number, personId?: string) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    filterBy: "transactionMonth",
  });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/monthly-view?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return { transactions: [], installments: [] };
  return res.json();
}

async function getAnnualReport(year: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/annual-report?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

type SearchParams = {
  annualYear?: string;
  monthYear?: string;
  monthMonth?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const globalPersonId = cookies().get("global-person-id")?.value ?? "";

  const annualYear = searchParams.annualYear
    ? parseInt(searchParams.annualYear, 10)
    : now.getFullYear();

  const monthYear = searchParams.monthYear
    ? parseInt(searchParams.monthYear, 10)
    : now.getFullYear();
  const monthMonth = searchParams.monthMonth
    ? parseInt(searchParams.monthMonth, 10)
    : now.getMonth() + 1;

  const [categories, { transactions, installments }, annualReport, people] = await Promise.all([
    getCategories(),
    getMonthlyView(monthYear, monthMonth, globalPersonId || undefined),
    getAnnualReport(annualYear, globalPersonId || undefined),
    getPeople(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Visão Geral" title="Dashboard" description="Resumo financeiro geral" />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Relatório Anual</CardTitle>
            <YearNav year={annualYear} />
          </div>
        </CardHeader>
        <CardContent>
          {annualReport ? (
            <AnnualReportSection report={annualReport} />
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-muted-foreground text-sm">Falha ao carregar relatório anual.</p>
              <RetryButton />
            </div>
          )}
        </CardContent>
      </Card>
      {annualReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MonthlyExpensesCard
            months={annualReport.months}
            people={people}
            globalPersonId={globalPersonId}
          />
          <IncomeExpenseBalanceCard
            months={annualReport.months}
            people={people}
            globalPersonId={globalPersonId}
          />
          <InvestmentOverviewCard
            months={annualReport.months}
            totalInvestments={annualReport.totalInvestments}
            people={people}
            globalPersonId={globalPersonId}
          />
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Resumo do Mês</CardTitle>
            <MonthNav
              year={monthYear}
              month={monthMonth}
              paramPrefix="month"
              basePath="/dashboard"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <MonthlySummaryCard transactions={transactions} installments={installments} />
          <Separator />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">Despesas por Categoria</h3>
              <Link
                href="/transactions"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver transações →
              </Link>
            </div>
            <CategoryBreakdownChart
              transactions={transactions}
              installments={installments}
              categories={categories}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
