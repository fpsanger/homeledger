"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => navigate(year - 1)}
        disabled={isPending}
        className="h-auto w-auto p-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Ano anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-xs text-muted-foreground select-none">Ano</span>
      <span className="font-semibold text-sm w-12 text-center select-none">{year}</span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => navigate(year + 1)}
        disabled={isPending}
        className="h-auto w-auto p-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Próximo ano"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
