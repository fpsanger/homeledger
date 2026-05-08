"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  year: number;
  month: number;
  people: Person[];
  currentPersonId: string;
};

export function MonthNav({ year, month, people, currentPersonId }: Props) {
  const router = useRouter();

  function navigate(newYear: number, newMonth: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("year", String(newYear));
    params.set("month", String(newMonth));
    if (currentPersonId) params.set("personId", currentPersonId);
    else params.delete("personId");
    router.push(`/dashboard?${params.toString()}`);
  }

  function prev() {
    if (month === 1) navigate(year - 1, 12);
    else navigate(year, month - 1);
  }

  function next() {
    if (month === 12) navigate(year + 1, 1);
    else navigate(year, month + 1);
  }

  function handlePersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set("year", String(year));
    params.set("month", String(month));
    if (e.target.value) params.set("personId", e.target.value);
    else params.delete("personId");
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={prev}>← Prev</Button>
        <span className="font-semibold text-base w-36 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button variant="outline" size="sm" onClick={next}>Next →</Button>
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
