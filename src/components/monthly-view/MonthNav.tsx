"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type Props = {
  year: number;
  month: number;
  basePath?: string;
  paramPrefix?: string;
};

export function MonthNav({ year, month, basePath = "/dashboard", paramPrefix = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const yearKey = paramPrefix ? `${paramPrefix}Year` : "year";
  const monthKey = paramPrefix ? `${paramPrefix}Month` : "month";

  function navigate(newYear: number, newMonth: number) {
    const params = new URLSearchParams(window.location.search);
    params.set(yearKey, String(newYear));
    params.set(monthKey, String(newMonth));
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    });
  }

  function prev() {
    if (month === 1) navigate(year - 1, 12);
    else navigate(year, month - 1);
  }

  function next() {
    if (month === 12) navigate(year + 1, 1);
    else navigate(year, month + 1);
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
        onClick={prev}
        disabled={isPending}
        className="h-auto w-auto p-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="font-semibold text-sm w-36 text-center select-none">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={next}
        disabled={isPending}
        className="h-auto w-auto p-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
