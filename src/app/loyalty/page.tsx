import { LoyaltyPageClient } from "@/components/loyalty/LoyaltyPageClient";

type LoyaltyProgramRecord = {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

async function getLoyaltyPrograms(): Promise<LoyaltyProgramRecord[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/loyalty/programs`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.programs ?? [];
}

export default async function LoyaltyPage() {
  const programs = await getLoyaltyPrograms();
  return <LoyaltyPageClient programs={programs} />;
}
