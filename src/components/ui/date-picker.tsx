"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  endMonth?: Date;
};

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", required, className, endMonth }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !value && "text-muted-foreground",
          className,
        )}
      >
        {value
          ? format(parseISO(value), "dd/MM/yyyy")
          : placeholder}
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(d: Date | undefined) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          locale={ptBR}
          captionLayout="dropdown"
          defaultMonth={value ? parseISO(value) : new Date()}
          endMonth={endMonth}
          required={required}
        />
      </PopoverContent>
    </Popover>
  );
}
