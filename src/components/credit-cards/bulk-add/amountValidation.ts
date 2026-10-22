import { parseCurrencyBR } from "@/lib/utils";

export function hasInvalidAmount(value: string): boolean {
  if (!value) return true;
  const amount = parseCurrencyBR(value);
  return !Number.isFinite(amount) || amount <= 0;
}
