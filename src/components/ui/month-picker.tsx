"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MonthPickerProps = {
  value: string; // yyyy-MM, or "" for none
  onChange: (value: string) => void;
  placeholder?: string;
  /** When set, shows an option that clears the value (onChange("")). */
  clearLabel?: string;
  /** Earliest selectable month, as yyyy-MM. Earlier months are disabled. */
  minValue?: string;
  /** Latest selectable month, as yyyy-MM. Later months are disabled. */
  maxValue?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

function parseMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function toValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Sortable ordinal for a year-month, so bounds compare with plain arithmetic. */
function ordinal({ year, month }: { year: number; month: number }): number {
  return year * 12 + month;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Selecione o mês",
  clearLabel,
  minValue,
  maxValue,
  disabled,
  className,
  id,
  ariaLabel,
}: MonthPickerProps) {
  const selected = parseMonth(value);
  const min = parseMonth(minValue ?? "");
  const max = parseMonth(maxValue ?? "");
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());

  function handleOpenChange(next: boolean) {
    if (next) setViewYear(selected?.year ?? today.getFullYear());
    setOpen(next);
  }

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        {selected
          ? format(new Date(selected.year, selected.month - 1, 1), "MMM/yyyy", { locale: ptBR })
          : placeholder}
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Ano anterior"
            disabled={min !== null && viewYear <= min.year}
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">{viewYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Próximo ano"
            disabled={max !== null && viewYear >= max.year}
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <MonthGrid
          viewYear={viewYear}
          selected={selected}
          currentYear={today.getFullYear()}
          currentMonth={today.getMonth() + 1}
          min={min}
          max={max}
          onPick={(month) => pick(toValue(viewYear, month))}
        />
        {clearLabel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => pick("")}
          >
            {clearLabel}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MonthGrid({
  viewYear,
  selected,
  currentYear,
  currentMonth,
  min,
  max,
  onPick,
}: {
  viewYear: number;
  selected: { year: number; month: number } | null;
  currentYear: number;
  currentMonth: number;
  min?: { year: number; month: number } | null;
  max?: { year: number; month: number } | null;
  onPick: (month: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const date = new Date(viewYear, month - 1, 1);
        const isSelected = selected?.year === viewYear && selected.month === month;
        const isCurrent = currentYear === viewYear && currentMonth === month;
        const cell = ordinal({ year: viewYear, month });
        const isOutOfRange =
          (min != null && cell < ordinal(min)) || (max != null && cell > ordinal(max));
        return (
          <button
            key={month}
            type="button"
            aria-label={format(date, "MMMM 'de' yyyy", { locale: ptBR })}
            aria-pressed={isSelected}
            disabled={isOutOfRange}
            onClick={() => onPick(month)}
            className={cn(
              buttonVariants({ variant: isSelected ? "default" : "ghost", size: "sm" }),
              "capitalize",
              !isSelected && isCurrent && "bg-accent text-accent-foreground",
              isOutOfRange && "pointer-events-none opacity-40",
            )}
          >
            {format(date, "MMM", { locale: ptBR })}
          </button>
        );
      })}
    </div>
  );
}
