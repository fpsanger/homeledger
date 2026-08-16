import { cookies } from "next/headers";
import { LoyaltyPageClient } from "@/components/loyalty/LoyaltyPageClient";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type LoyaltyProgramRecord = {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

async function getLoyaltyPrograms(): Promise<LoyaltyProgramRecord[]> {
  const res = await fetch(`${BASE}/api/loyalty/programs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.programs ?? [];
}

async function getTransfers(): Promise<Transfer[]> {
  const res = await fetch(`${BASE}/api/loyalty/transfers`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transfers ?? [];
}

type Summary = {
  currentBalance: number;
  totalInvested: number;
  totalPurchasedPoints: number;
  avgCostPer1kPoints: number;
  totalValueRedeemed: number;
  totalExpired: number;
  overallRoi: number | null;
};

const EMPTY_SUMMARY: Summary = {
  currentBalance: 0,
  totalInvested: 0,
  totalPurchasedPoints: 0,
  avgCostPer1kPoints: 0,
  totalValueRedeemed: 0,
  totalExpired: 0,
  overallRoi: null,
};

async function getProgramSummary(id: string, personId?: string): Promise<Summary> {
  const url = new URL(`${BASE}/api/loyalty/programs/${id}/report`);
  if (personId) url.searchParams.set("personId", personId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return EMPTY_SUMMARY;
  const data = await res.json();
  return { ...EMPTY_SUMMARY, ...data.summary };
}

export default async function LoyaltyPage() {
  const cookieStore = await cookies();
  const globalPersonId = cookieStore.get("global-person-id")?.value ?? "";

  const [programs, transfers] = await Promise.all([getLoyaltyPrograms(), getTransfers()]);

  const summaries = Object.fromEntries(
    await Promise.all(
      programs.map(
        async (p) =>
          [p.id, await getProgramSummary(p.id, globalPersonId || undefined)] as [string, Summary],
      ),
    ),
  );

  return (
    <LoyaltyPageClient
      programs={programs}
      transfers={transfers}
      summaries={summaries}
      personId={globalPersonId || undefined}
    />
  );
}
