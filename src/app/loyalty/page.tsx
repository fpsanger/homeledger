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

type Person = { id: string; name: string };

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

async function getPeople(): Promise<Person[]> {
  const res = await fetch(`${BASE}/api/people`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.people ?? [];
}

async function getProgramBalance(id: string, personId?: string): Promise<number> {
  const url = new URL(`${BASE}/api/loyalty/programs/${id}/report`);
  if (personId) url.searchParams.set("personId", personId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.summary?.currentBalance ?? 0;
}

type SearchParams = { personId?: string };

export default async function LoyaltyPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieStore = await cookies();
  const globalPersonId = cookieStore.get("global-person-id")?.value ?? "";
  const isGlobalLocked = !!globalPersonId;
  const personId = isGlobalLocked ? globalPersonId : (searchParams.personId ?? "");

  const [programs, transfers, people] = await Promise.all([
    getLoyaltyPrograms(),
    getTransfers(),
    getPeople(),
  ]);

  const balances = Object.fromEntries(
    await Promise.all(
      programs.map(async (p) => [p.id, await getProgramBalance(p.id, personId || undefined)] as [string, number]),
    ),
  );

  return (
    <LoyaltyPageClient
      programs={programs}
      transfers={transfers}
      balances={balances}
      people={people}
      currentPersonId={personId}
      isGlobalLocked={isGlobalLocked}
    />
  );
}
