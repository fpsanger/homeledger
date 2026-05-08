import { InstallmentTable } from "@/components/monthly-view/InstallmentTable";
import { MonthNav } from "@/components/monthly-view/MonthNav";
import { TransactionTable } from "@/components/monthly-view/TransactionTable";
import { AnnualReportCards } from "@/components/dashboard/AnnualReportCards";
import { YearNav } from "@/components/dashboard/YearNav";
import { Separator } from "@/components/ui/separator";

type Person = { id: string; name: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE_URL}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people;
}

async function getMonthlyView(year: number, month: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/monthly-view?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return { transactions: [], installments: [] };
  return res.json();
}

async function getAnnualReport(year: number, personId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (personId) params.set("personId", personId);
  const res = await fetch(`${BASE_URL}/api/annual-report?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

type SearchParams = {
  year?: string;
  month?: string;
  personId?: string;
  annualYear?: string;
  annualPersonId?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
  const personId = searchParams.personId ?? "";
  const annualYear = searchParams.annualYear ? parseInt(searchParams.annualYear, 10) : now.getFullYear();
  const annualPersonId = searchParams.annualPersonId ?? "";

  const [people, { transactions, installments }, annualReport] = await Promise.all([
    getPeople(),
    getMonthlyView(year, month, personId || undefined),
    getAnnualReport(annualYear, annualPersonId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Monthly View</h2>
          <MonthNav year={year} month={month} people={people} currentPersonId={personId} />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Transactions</h3>
          <TransactionTable transactions={transactions} people={people} />
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Installments</h3>
          <InstallmentTable installments={installments} />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Annual Report</h2>
          <YearNav year={annualYear} people={people} currentPersonId={annualPersonId} />
        </div>

        {annualReport ? (
          <AnnualReportCards report={annualReport} />
        ) : (
          <p className="text-muted-foreground text-sm">Failed to load annual report.</p>
        )}
      </section>
    </div>
  );
}
