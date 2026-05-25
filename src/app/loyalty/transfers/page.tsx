import { TransfersPageClient } from "@/components/loyalty/TransfersPageClient";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type Transfer = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  transferDate: string;
  description: string | null;
};

type Program = { id: string; name: string };

async function getTransfers(): Promise<Transfer[]> {
  const res = await fetch(`${BASE}/api/loyalty/transfers`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transfers ?? [];
}

async function getPrograms(): Promise<Program[]> {
  const res = await fetch(`${BASE}/api/loyalty/programs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.programs ?? [];
}

export default async function LoyaltyTransfersPage() {
  const [transfers, programs] = await Promise.all([getTransfers(), getPrograms()]);
  return <TransfersPageClient transfers={transfers} programs={programs} />;
}
