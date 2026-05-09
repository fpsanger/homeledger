"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string };

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Props = {
  year: number;
  month: number;
  people: Person[];
  currentPersonId: string;
  basePath?: string;
  paramPrefix?: string;
  isGlobalLocked?: boolean;
};

export function MonthNav({ year, month, people, currentPersonId, basePath = "/dashboard", paramPrefix = "", isGlobalLocked = false }: Props) {
  const router = useRouter();

  const yearKey = paramPrefix ? `${paramPrefix}Year` : "year";
  const monthKey = paramPrefix ? `${paramPrefix}Month` : "month";
  const personKey = paramPrefix ? `${paramPrefix}PersonId` : "personId";

  function navigate(newYear: number, newMonth: number) {
    const params = new URLSearchParams(window.location.search);
    params.set(yearKey, String(newYear));
    params.set(monthKey, String(newMonth));
    if (currentPersonId) params.set(personKey, currentPersonId);
    else params.delete(personKey);
    router.push(`${basePath}?${params.toString()}`);
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
    params.set(yearKey, String(year));
    params.set(monthKey, String(month));
    if (e.target.value) params.set(personKey, e.target.value);
    else params.delete(personKey);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={prev}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm w-36 text-center select-none">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={next}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Próximo mês"
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
