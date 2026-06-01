import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyProgramDetail } from "@/components/loyalty/LoyaltyProgramDetail";
import { BackButton } from "@/components/loyalty/BackButton";

type FifoData = {
  costBrl: number;
  costPer1kPoints: number;
  roi: number | null;
};

type EnrichedTransaction = {
  id: string;
  programId: string;
  type: string;
  points: number;
  date: string;
  description: string | null;
  expiresAt: string | null;
  costBrl: number | null;
  valueBrl: number | null;
  transferId: string | null;
  fifoData?: FifoData;
};

type Summary = {
  currentBalance: number;
  totalInvested: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
};

type Report = {
  summary: Summary;
  transactions: EnrichedTransaction[];
};

type Program = {
  id: string;
  name: string;
  type: string;
  color: string;
};

async function getProgram(id: string): Promise<Program | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/loyalty/programs`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.programs as Program[]).find((p) => p.id === id) ?? null;
}

async function getReport(programId: string, personId?: string): Promise<Report | null> {
  const url = new URL(
    `/api/loyalty/programs/${programId}/report`,
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  );
  if (personId) url.searchParams.set("personId", personId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getPeople(): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/people`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.people ?? [];
}

type SearchParams = { personId?: string };

export default async function LoyaltyProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: SearchParams;
}) {
  const { programId } = await params;
  const cookieStore = await cookies();
  const globalPersonId = cookieStore.get("global-person-id")?.value ?? "";
  const isGlobalLocked = !!globalPersonId;
  const personId = isGlobalLocked ? globalPersonId : (searchParams.personId ?? "");

  const [program, report, people] = await Promise.all([
    getProgram(programId),
    getReport(programId, personId || undefined),
    getPeople(),
  ]);

  if (!program || !report) notFound();

  return (
    <div className="flex flex-col gap-6">
      <BackButton label="Milhas" />
      <PageHeader
        eyebrow="Milhas"
        title={program.name}
        description={`${report.summary.currentBalance.toLocaleString("pt-BR")} pontos`}
      />
      <LoyaltyProgramDetail
        program={program}
        report={report}
        people={people}
        currentPersonId={personId}
        isGlobalLocked={isGlobalLocked}
      />
    </div>
  );
}
