"use client";

import RawCurrencyInput from "react-currency-input-field";
import { cn } from "@/lib/utils";

type CurrencyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function CurrencyInput({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
  placeholder = "R$ 0,00",
  "aria-label": ariaLabel,
}: CurrencyInputProps) {
  return (
    <RawCurrencyInput
      id={id}
      name={id}
      aria-label={ariaLabel}
      placeholder={placeholder}
      decimalsLimit={2}
      decimalSeparator=","
      groupSeparator="."
      prefix="R$ "
      value={value}
      onValueChange={(v) => onChange(v ?? "")}
      required={required}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
