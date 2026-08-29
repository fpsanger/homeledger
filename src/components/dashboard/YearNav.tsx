"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  year: number;
};

export function YearNav({ year }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(newYear: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("annualYear", String(newYear));
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      className={`flex items-center gap-1 transition-opacity duration-200 ${isPending ? "opacity-50" : ""}`}
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => navigate(year - 1)}
        disabled={isPending}
        className="p-3.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        aria-label="Ano anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground select-none">Ano</span>
      <span className="font-semibold text-sm w-12 text-center select-none">{year}</span>
      <button
        type="button"
        onClick={() => navigate(year + 1)}
        disabled={isPending}
        className="p-3.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        aria-label="Próximo ano"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
