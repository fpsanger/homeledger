"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };

type Props = {
  year: number;
  people: Person[];
  currentPersonId: string;
};

export function YearNav({ year, people, currentPersonId }: Props) {
  const router = useRouter();

  function navigate(newYear: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(newYear));
    if (currentPersonId) params.set("annualPersonId", currentPersonId);
    else params.delete("annualPersonId");
    router.push(`/dashboard?${params.toString()}`);
  }

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(year));
    if (e.target.value) params.set("annualPersonId", e.target.value);
    else params.delete("annualPersonId");
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(year - 1)}>← Prev</Button>
        <span className="font-semibold text-base w-16 text-center">{year}</span>
        <Button variant="outline" size="sm" onClick={() => navigate(year + 1)}>Next →</Button>
      </div>
      <Select value={currentPersonId} onChange={handlePersonChange} className="w-44">
        <option value="">All people</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
    </div>
  );
}
