"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };

type Props = {
  year: number;
  people: Person[];
  currentPersonId: string;
  isGlobalLocked?: boolean;
};

export function YearNav({ year, people, currentPersonId, isGlobalLocked = false }: Props) {
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
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate(year - 1)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Ano anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm w-16 text-center select-none">{year}</span>
        <button
          type="button"
          onClick={() => navigate(year + 1)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Próximo ano"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {isGlobalLocked ? (
        <span className="text-sm text-muted-foreground px-2 py-1 border rounded-md bg-muted/40 w-40 truncate">
          {people.find((p) => p.id === currentPersonId)?.name ?? "Todas as pessoas"}
        </span>
      ) : (
        <Select value={currentPersonId} onChange={handlePersonChange} className="w-40 h-8 text-sm">
          <option value="">Todas as pessoas</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      )}
    </div>
  );
}
