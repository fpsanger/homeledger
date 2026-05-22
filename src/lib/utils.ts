import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CurrencyInput uses BR format (. thousands, , decimal). parseFloat expects . as decimal.
export function parseCurrencyBR(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

export function formatAmountBR(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}
