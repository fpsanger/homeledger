"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
};

export function YearNav({ year }: Props) {
  const router = useRouter();

  function navigate(newYear: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(newYear));
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => navigate(year - 1)}
        className="p-3.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Ano anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground select-none">Ano</span>
      <span className="font-semibold text-sm w-12 text-center select-none">{year}</span>
      <button
        type="button"
        onClick={() => navigate(year + 1)}
        className="p-3.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Próximo ano"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
