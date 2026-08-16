import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/loyalty/BackButton";
import { LoyaltyProgramDetail } from "@/components/loyalty/LoyaltyProgramDetail";
import { PageHeader } from "@/components/ui/page-header";

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
  personId: string | null;
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

export default async function LoyaltyProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const cookieStore = await cookies();
  const globalPersonId = cookieStore.get("global-person-id")?.value ?? "";

  const [program, report] = await Promise.all([
    getProgram(programId),
    getReport(programId, globalPersonId || undefined),
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
      <LoyaltyProgramDetail program={program} report={report} defaultPersonId={globalPersonId} />
    </div>
  );
}
